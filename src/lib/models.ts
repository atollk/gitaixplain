export const apiList = ["Gemini", "Groq", "Ollama"] as const
export type ApiName = (typeof apiList)[number]
