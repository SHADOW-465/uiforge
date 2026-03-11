import { NextResponse } from "next/server"

export const runtime = "nodejs"

type Provider = "anthropic" | "groq" | "openrouter"

type InferenceRequest = {
  prompt?: string
  provider?: Provider
  model?: string
}

const DEFAULT_PROVIDER: Provider = "groq"
const DEFAULT_MODEL = "llama-3.1-8b-instant"

function normalizeErrorMessage(message: string) {
  if (message.toLowerCase().includes("credit balance is too low")) {
    return { code: "insufficient_credits", message }
  }
  if (message.toLowerCase().includes("insufficient_quota")) {
    return { code: "insufficient_credits", message }
  }
  return { code: "provider_error", message }
}

async function callAnthropic(apiKey: string, model: string, prompt: string) {
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
    const normalized = normalizeErrorMessage(errorText)
    return { ok: false, status: response.status, error: normalized.message, code: normalized.code }
  }

  const data = await response.json()
  const output = data?.content?.[0]?.text ?? ""
  return { ok: true, output }
}

async function callOpenAICompat(url: string, apiKey: string, model: string, prompt: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 900,
      temperature: 0.4,
    }),
  })

  const text = await response.text()
  if (!response.ok) {
    const normalized = normalizeErrorMessage(text)
    return { ok: false, status: response.status, error: normalized.message, code: normalized.code }
  }

  const data = JSON.parse(text)
  const output = data?.choices?.[0]?.message?.content ?? ""
  return { ok: true, output }
}

export async function POST(request: Request) {
  const { prompt, provider, model } = (await request.json().catch(() => ({}))) as InferenceRequest

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
  }

  const selectedProvider = provider ?? DEFAULT_PROVIDER
  const selectedModel = model ?? DEFAULT_MODEL

  if (selectedProvider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 })
    }
    const result = await callAnthropic(apiKey, selectedModel, prompt)
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code, provider: "anthropic" }, { status: 502 })
    }
    return NextResponse.json({ output: result.output, provider: "anthropic", model: selectedModel })
  }

  if (selectedProvider === "groq") {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 500 })
    }
    const result = await callOpenAICompat("https://api.groq.com/openai/v1/chat/completions", apiKey, selectedModel, prompt)
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code, provider: "groq" }, { status: 502 })
    }
    return NextResponse.json({ output: result.output, provider: "groq", model: selectedModel })
  }

  if (selectedProvider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY is not set" }, { status: 500 })
    }
    const result = await callOpenAICompat("https://openrouter.ai/api/v1/chat/completions", apiKey, selectedModel, prompt)
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code, provider: "openrouter" }, { status: 502 })
    }
    return NextResponse.json({ output: result.output, provider: "openrouter", model: selectedModel })
  }

  return NextResponse.json({ error: "Unsupported provider" }, { status: 400 })
}
