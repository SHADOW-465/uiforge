export type Provider = "anthropic" | "groq" | "openrouter"

export type InferenceResult = {
  ok: boolean
  output?: string
  error?: string
  code?: string
}

const DEFAULT_PROVIDER: Provider = "groq"
const DEFAULT_MODEL = "llama-3.1-8b-instant"

function normalizeErrorMessage(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("credit balance is too low") || lower.includes("insufficient_quota")) {
    return { code: "insufficient_credits", message }
  }
  return { code: "provider_error", message }
}

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<InferenceResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    const normalized = normalizeErrorMessage(errorText)
    return { ok: false, error: normalized.message, code: normalized.code }
  }

  const data = await response.json()
  return { ok: true, output: data?.content?.[0]?.text ?? "" }
}

async function callOpenAICompat(url: string, apiKey: string, model: string, prompt: string): Promise<InferenceResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.3,
    }),
  })

  const text = await response.text()
  if (!response.ok) {
    const normalized = normalizeErrorMessage(text)
    return { ok: false, error: normalized.message, code: normalized.code }
  }

  const data = JSON.parse(text)
  return { ok: true, output: data?.choices?.[0]?.message?.content ?? "" }
}

export async function runInference(params: {
  prompt: string
  provider?: Provider
  model?: string
}): Promise<InferenceResult> {
  const provider = params.provider ?? DEFAULT_PROVIDER
  const model = params.model ?? DEFAULT_MODEL

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return { ok: false, error: "ANTHROPIC_API_KEY is not set", code: "missing_key" }
    }
    return callAnthropic(apiKey, model, params.prompt)
  }

  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return { ok: false, error: "GROQ_API_KEY is not set", code: "missing_key" }
    }
    return callOpenAICompat("https://api.groq.com/openai/v1/chat/completions", apiKey, model, params.prompt)
  }

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return { ok: false, error: "OPENROUTER_API_KEY is not set", code: "missing_key" }
    }
    return callOpenAICompat("https://openrouter.ai/api/v1/chat/completions", apiKey, model, params.prompt)
  }

  return { ok: false, error: "Unsupported provider", code: "unsupported_provider" }
}
