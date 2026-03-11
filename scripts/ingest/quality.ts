import fs from "node:fs/promises"
import path from "node:path"
import { PNG } from "pngjs"

export async function readPng(pathname: string) {
  const data = await fs.readFile(pathname)
  return PNG.sync.read(data)
}

export function computeLumaStats(png: PNG) {
  const { data, width, height } = png
  const totalPixels = width * height
  let sum = 0
  let sumSq = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sum += luma
    sumSq += luma * luma
  }

  const mean = sum / totalPixels
  const variance = sumSq / totalPixels - mean * mean
  const stdDev = Math.sqrt(Math.max(variance, 0))
  return { mean, stdDev }
}

export function computeAHash(png: PNG) {
  const { data, width, height } = png
  const size = 8
  const pixels: number[] = []

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcX = Math.floor((x / size) * width)
      const srcY = Math.floor((y / size) * height)
      const idx = (srcY * width + srcX) * 4
      const r = data[idx] / 255
      const g = data[idx + 1] / 255
      const b = data[idx + 2] / 255
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
      pixels.push(luma)
    }
  }

  const avg = pixels.reduce((acc, value) => acc + value, 0) / pixels.length
  return pixels.map((value) => (value > avg ? "1" : "0")).join("")
}

export function hammingDistance(a: string, b: string) {
  if (a.length !== b.length) return Infinity
  let distance = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) distance += 1
  }
  return distance
}

export async function getFileSizeKb(filePath: string) {
  const stats = await fs.stat(filePath)
  return stats.size / 1024
}

export async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}
