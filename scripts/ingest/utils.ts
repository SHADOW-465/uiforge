import fs from "node:fs/promises"
import path from "node:path"

export async function collectFiles(root: string, extensions: string[]) {
  const results: string[] = []

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
        results.push(full)
      }
    }
  }

  await walk(root)
  return results
}

export function guessCategory(filename: string, rules: Array<{ pattern: string; category: string }>) {
  const lower = filename.toLowerCase()
  for (const rule of rules) {
    const regex = new RegExp(rule.pattern, "i")
    if (regex.test(lower)) {
      return rule.category
    }
  }
  return "components"
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

export function titleFromFilename(filePath: string) {
  const base = path.basename(filePath)
  const name = base.replace(path.extname(base), "")
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
