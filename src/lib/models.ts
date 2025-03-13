export const apiList = ["Gemini", "Groq", "Anthropic", "Ollama"] as const
export type ApiName = (typeof apiList)[number]
