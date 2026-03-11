import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import "dotenv/config"
import { randomUUID } from "crypto"

import config from "./ingest.config.json"
import { runInference } from "./inference"
import { renderHtmlToImage, wrapWithTailwind } from "./screenshot"
import { slugify } from "./utils"
import { loadFlowbite } from "./sources/flowbite"
import { loadHyperUI } from "./sources/hyperui"
import { loadShadcn } from "./sources/shadcn"
import { computeAHash, computeLumaStats, getFileSizeKb, hammingDistance, readPng, ensureDir } from "./quality"
import { loadCache, saveCache } from "./cache"
import { renderReactPreview } from "./react-harness"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SourceKind = "react" | "html"

type SourceComponent = {
  name: string
  category: string
  description?: string
  code: string
  previewHtml?: string
  sourcePath: string
}

type SourceConfig = {
  displayName: string
  kind: SourceKind
  fileGlobs: string[]
  categoryRules: Array<{ pattern: string; category: string }>
}

type IngestConfig = {
  defaults: {
    provider: "anthropic" | "groq" | "openrouter"
    model: string
    screenshot: {
      width: number
      height: number
      format: "webp" | "png"
      scale: number
    }
    quality: {
      minFileSizeKb: number
      minContrastStdDev: number
      dedupeThreshold: number
    }
  }
  sources: Record<string, SourceConfig>
}

const parsedConfig = config as IngestConfig

function getSourceLoader(source: string) {
  if (source === "flowbite") return loadFlowbite
  if (source === "hyperui") return loadHyperUI
  if (source === "shadcn") return loadShadcn
  throw new Error(`Unknown source: ${source}`)
}

async function ensureCategory(name: string, slug: string) {
  const { data: existing } = await supabase
    .from('Category')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) return existing

  const id = randomUUID()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('Category')
    .insert({ id, name, slug, createdAt: now, updatedAt: now })
    .select('id')
    .single()
  if (error) throw new Error(`Failed to create category: ${error.message}`)
  return data
}

async function ensureTags(tags: string[]) {
  const unique = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)))
  const records: { id: string }[] = []
  for (const name of unique) {
    const { data: existing } = await supabase
      .from('Tag')
      .select('id')
      .eq('name', name)
      .maybeSingle()
    if (existing) {
      records.push(existing)
      continue
    }
    const id = randomUUID()
    const { data, error } = await supabase.from('Tag').insert({ id, name }).select('id').single()
    if (error) throw new Error(`Failed to create tag: ${error.message}`)
    records.push(data)
  }
  return records
}

async function shouldRejectPreview(filePath: string, hashes: string[]) {
  const { minFileSizeKb, minContrastStdDev, dedupeThreshold } = parsedConfig.defaults.quality

  const fileSize = await getFileSizeKb(filePath)
  if (fileSize < minFileSizeKb) {
    return { reject: true, reason: "low_res" as const, hash: null }
  }

  const png = await readPng(filePath)
  const stats = computeLumaStats(png)
  if (stats.stdDev < minContrastStdDev) {
    return { reject: true, reason: "low_contrast" as const, hash: null }
  }

  const hash = computeAHash(png)
  const isDuplicate = hashes.some((existing) => hammingDistance(existing, hash) <= dedupeThreshold)

  if (isDuplicate) {
    return { reject: true, reason: "duplicate" as const, hash }
  }

  return { reject: false, reason: "ok" as const, hash }
}

async function main() {
  const args = process.argv.slice(2)
  const source = args.find((arg) => arg.startsWith("--source="))?.split("=")[1]
  const root = args.find((arg) => arg.startsWith("--path="))?.split("=")[1]
  const limit = Number(args.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? "0")
  const dryRun = args.includes("--dry-run")
  const reactPreviews = args.includes("--react-previews")
  const provider = args.find((arg) => arg.startsWith("--provider="))?.split("=")[1] as
    | "anthropic"
    | "groq"
    | "openrouter"
    | undefined
  const model = args.find((arg) => arg.startsWith("--model="))?.split("=")[1]

  if (!source || !root) {
    console.error("Usage: tsx scripts/ingest/index.ts --source=flowbite --path=/path/to/source")
    process.exit(1)
  }

  const sourceConfig = parsedConfig.sources[source]
  if (!sourceConfig) {
    console.error(`Source not found in config: ${source}`)
    process.exit(1)
  }

  const loader = getSourceLoader(source)
  const components: SourceComponent[] = await loader(root, sourceConfig.categoryRules)

  const limited = limit > 0 ? components.slice(0, limit) : components
  const cache = await loadCache()
  const cacheHashes = Object.values(cache.hashes)

  console.log(`Found ${components.length} components. Processing ${limited.length}.`)

  for (const component of limited) {
    const categorySlug = slugify(component.category)
    const categoryName = component.category
      .split("_")
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ")

    // Dedup check by component name
    const { data: existingComp } = await supabase
      .from('Component')
      .select('id')
      .eq('name', component.name)
      .maybeSingle()
    if (existingComp) {
      console.log(`Skipped duplicate: ${component.name}`)
      continue
    }

    const category = dryRun ? null : await ensureCategory(categoryName, categorySlug)

    const metadataPrompt = `Extract metadata for a UI component. Return JSON with keys: tags (array), description (string), promptFragment (string).
Component name: ${component.name}
Category: ${component.category}
Code/Markup:\n${component.code}`

    const inference = await runInference({
      prompt: metadataPrompt,
      provider: provider ?? parsedConfig.defaults.provider,
      model: model ?? parsedConfig.defaults.model,
    })

    let tags: string[] = []
    let description = component.description ?? ""
    let promptFragment = ""

    if (inference.ok && inference.output) {
      try {
        const parsed = JSON.parse(inference.output)
        tags = Array.isArray(parsed.tags) ? parsed.tags : []
        description = parsed.description ?? description
        promptFragment = parsed.promptFragment ?? ""
      } catch {
        description = description || inference.output.slice(0, 140)
      }
    }

    let previewPath: string | null = null
    let previewFile: string | null = null

    if (component.previewHtml) {
      const filename = `${slugify(component.name)}.${parsedConfig.defaults.screenshot.format}`
      previewPath = `/previews/${source}/${filename}`
      previewFile = path.join(process.cwd(), "public", "previews", source, filename)

      if (!dryRun) {
        await ensureDir(previewFile)
        await renderHtmlToImage({
          html: wrapWithTailwind(component.previewHtml),
          outputPath: previewFile,
          width: parsedConfig.defaults.screenshot.width,
          height: parsedConfig.defaults.screenshot.height,
          scale: parsedConfig.defaults.screenshot.scale,
        })
      }
    }

    if (!component.previewHtml && reactPreviews) {
      const filename = `${slugify(component.name)}.${parsedConfig.defaults.screenshot.format}`
      previewPath = `/previews/${source}/${filename}`
      previewFile = path.join(process.cwd(), "public", "previews", source, filename)

      if (!dryRun) {
        await ensureDir(previewFile)
        await renderReactPreview({
          sourcePath: path.join(root, component.sourcePath),
          outputPath: previewFile,
          width: parsedConfig.defaults.screenshot.width,
          height: parsedConfig.defaults.screenshot.height,
          scale: parsedConfig.defaults.screenshot.scale,
        })
      }
    }

    if (previewFile && !dryRun) {
      const quality = await shouldRejectPreview(previewFile, cacheHashes)
      if (quality.reject) {
        console.log(`Rejected ${component.name}: ${quality.reason}`)
        continue
      }
      if (quality.hash) {
        cache.hashes[`${source}:${component.name}`] = quality.hash
        cacheHashes.push(quality.hash)
      }
    }

    if (dryRun) {
      console.log(`[DRY RUN] ${component.name} -> ${categoryName} (${tags.join(", ")})`)
      continue
    }

    const componentId = randomUUID()
    const variantId = randomUUID()
    const snippetId = randomUUID()
    const now = new Date().toISOString()

    const { error: compError } = await supabase.from('Component').insert({
      id: componentId,
      name: component.name,
      description: description || null,
      categoryId: category!.id,
      createdAt: now,
      updatedAt: now,
    })
    if (compError) throw new Error(`Failed to create component: ${compError.message}`)

    const { error: varError } = await supabase.from('ComponentVariant').insert({
      id: variantId,
      componentId,
      name: "Default",
      previewImage: previewPath,
      promptFragment: promptFragment || null,
      createdAt: now,
      updatedAt: now,
    })
    if (varError) throw new Error(`Failed to create variant: ${varError.message}`)

    const { error: snippetError } = await supabase.from('CodeSnippet').insert({
      id: snippetId,
      variantId,
      language: sourceConfig.kind === "react" ? "tsx" : "html",
      code: component.code,
      createdAt: now,
      updatedAt: now,
    })
    if (snippetError) throw new Error(`Failed to create snippet: ${snippetError.message}`)

    const tagRecords = await ensureTags(tags)
    for (const tag of tagRecords) {
      await supabase.from('ComponentTag').insert({
        componentId,
        tagId: tag.id,
      })
    }

    console.log(`Saved ${component.name} (${categoryName})`)
  }

  await saveCache(cache)
}

main().catch(async (error) => {
  console.error(error)
  process.exit(1)
})
