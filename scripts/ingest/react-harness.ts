import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { chromium } from "playwright"
import { ensureDir } from "./quality"

const PREVIEW_FILE = path.join(process.cwd(), "src", "ingest-preview", "Preview.tsx")
const PREVIEW_ROUTE = "http://localhost:4100/__preview"

function extractExportName(code: string) {
  const defaultMatch = code.match(/export\s+default\s+function\s+(\w+)/)
  if (defaultMatch) return { name: defaultMatch[1], isDefault: true }
  const namedMatch = code.match(/export\s+function\s+(\w+)/)
  if (namedMatch) return { name: namedMatch[1], isDefault: false }
  const constMatch = code.match(/export\s+const\s+(\w+)/)
  if (constMatch) return { name: constMatch[1], isDefault: false }
  return null
}

function toPreviewImport(sourcePath: string) {
  const root = process.cwd()
  const relative = path.relative(path.join(root, "src", "ingest-preview"), sourcePath)
  const normalized = relative.replace(/\\/g, "/")
  return normalized.startsWith(".") ? normalized : `./${normalized}`
}

async function writePreviewModule(sourcePath: string, code: string) {
  const exportName = extractExportName(code)
  const importPath = toPreviewImport(sourcePath)

  const importLine = exportName?.isDefault
    ? `import PreviewComponent from "${importPath}"`
    : exportName
      ? `import { ${exportName.name} as PreviewComponent } from "${importPath}"`
      : `import PreviewComponent from "${importPath}"`

  const content = `"use client"\n\n${importLine}\n\nexport default function Preview() {\n  return (\n    <div style={{ padding: "32px" }}>\n      <PreviewComponent />\n    </div>\n  )\n}\n`

  await ensureDir(PREVIEW_FILE)
  await fs.writeFile(PREVIEW_FILE, content, "utf-8")
}

async function waitForServer(url: string) {
  const maxRetries = 40
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error("Preview server did not start")
}

async function ensurePreviewServer() {
  try {
    const res = await fetch(PREVIEW_ROUTE)
    if (res.ok) return null
  } catch {
    // ignore
  }

  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next")
  const proc = spawn("node", [nextBin, "dev", "-p", "4100"], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: "ignore",
  })

  await waitForServer(PREVIEW_ROUTE)
  return proc
}

export async function renderReactPreview(params: {
  sourcePath: string
  outputPath: string
  width: number
  height: number
  scale: number
}) {
  const code = await fs.readFile(params.sourcePath, "utf-8")
  await writePreviewModule(params.sourcePath, code)

  const previewServer = await ensurePreviewServer()

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: params.width, height: params.height, deviceScaleFactor: params.scale } })

  await page.goto(PREVIEW_ROUTE, { waitUntil: "networkidle" })
  await page.screenshot({ path: params.outputPath, fullPage: true })

  await browser.close()
  if (previewServer) {
    previewServer.kill()
  }
}
