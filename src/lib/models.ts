export const modelsList = ["Gemini", "Ollama"] as const
export type ModelName = (typeof modelsList)[number]
