import fs from "node:fs/promises"
import path from "node:path"
import { collectFiles, guessCategory, titleFromFilename } from "../utils"

export type SourceComponent = {
  name: string
  category: string
  description?: string
  code: string
  previewHtml?: string
  sourcePath: string
}

export async function loadHyperUI(root: string, rules: Array<{ pattern: string; category: string }>) {
  const files = await collectFiles(root, [".html", ".md"]) 
  const components: SourceComponent[] = []

  for (const filePath of files) {
    // Skip dark-mode variants — they render identically without dark class on <html>
    if (path.basename(filePath).includes('-dark.')) continue
    const content = await fs.readFile(filePath, "utf-8")
    const parentDir = path.basename(path.dirname(filePath))
    const fileNum = titleFromFilename(filePath)
    const name = `${parentDir.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase())} ${fileNum}`
    const category = guessCategory(filePath, rules)

    const htmlMatch = content.match(/```html([\s\S]*?)```/i)
    const previewHtml = htmlMatch ? htmlMatch[1].trim() : (content.includes("<") ? content : undefined)

    components.push({
      name,
      category,
      code: content,
      previewHtml,
      sourcePath: path.relative(root, filePath),
    })
  }

  return components
}
