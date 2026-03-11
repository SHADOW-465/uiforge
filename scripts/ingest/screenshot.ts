import fs from "node:fs/promises"
import path from "node:path"
import { chromium } from "playwright"

export async function renderHtmlToImage(params: {
  html: string
  outputPath: string
  width: number
  height: number
  scale: number
}) {
  const { html, outputPath, width, height, scale } = params
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width, height, deviceScaleFactor: scale } })

  await page.setContent(html, { waitUntil: "networkidle" })
  await page.screenshot({ path: outputPath })

  await browser.close()
}

export async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

export function wrapWithTailwind(html: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body{margin:0;padding:32px;background:#0b0f14;color:#e2e8f0;font-family:ui-sans-serif,system-ui;}</style>
  </head>
  <body>${html}</body>
</html>`
}
