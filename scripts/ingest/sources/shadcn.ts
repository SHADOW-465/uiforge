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

export async function loadShadcn(root: string, rules: Array<{ pattern: string; category: string }>) {
  const files = await collectFiles(root, [".tsx"]) 
  const components: SourceComponent[] = []

  for (const filePath of files) {
    const content = await fs.readFile(filePath, "utf-8")
    const name = titleFromFilename(filePath)
    const category = guessCategory(filePath, rules)

    components.push({
      name,
      category,
      code: content,
      sourcePath: path.relative(root, filePath),
    })
  }

  return components
}
