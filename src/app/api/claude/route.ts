import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 })
  }

  const { prompt } = await request.json().catch(() => ({ prompt: "" }))

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest"

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return NextResponse.json({ error: "Anthropic API error", details: errorText }, { status: 502 })
  }

  const data = await response.json()
  const output = data?.content?.[0]?.text ?? ""

  return NextResponse.json({ output })
}
