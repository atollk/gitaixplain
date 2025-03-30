export const chatProviderList = ["Gemini", "Groq", "Anthropic", "Ollama"] as const
export type ChatProviderName = (typeof chatProviderList)[number]

export const embeddingProviderList = ["Gemini", "Voyage", "Ollama", "local"] as const
export type EmbeddingProviderName = (typeof embeddingProviderList)[number]
