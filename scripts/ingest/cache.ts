import fs from "node:fs/promises"

export type IngestCache = {
  hashes: Record<string, string>
}

const CACHE_PATH = ".ingest-cache.json"

export async function loadCache(): Promise<IngestCache> {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf-8")
    return JSON.parse(raw) as IngestCache
  } catch {
    return { hashes: {} }
  }
}

export async function saveCache(cache: IngestCache) {
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2))
}
