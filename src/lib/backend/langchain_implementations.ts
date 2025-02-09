import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatOllama } from "@langchain/ollama"
import type { ModelName } from "$lib/models"

type GeminiInterfaceConfig = { apiKey: string }

export class GeminiInterface extends LangchainBaseInterface<GeminiInterfaceConfig> {
    constructor(config: GeminiInterfaceConfig) {
        super(
            config,
            () =>
                new ChatGoogleGenerativeAI({
                    model: "gemini-1.5-flash",
                    apiKey: config.apiKey,
                }),
        )
    }

    get name(): ModelName {
        return "Gemini"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return 1_000_000
    }
}

export type OllamaInterfaceConfig = { contextWindowSize: number }

export class OllamaInterface extends LangchainBaseInterface<OllamaInterfaceConfig> {
    static models = { ["gemma2:2b"]: { maxContext: 8192 } }

    constructor(config: OllamaInterfaceConfig) {
        super(config, () => {
            const baseModel = OllamaInterface.models["gemma2:2b"]

            const model = new ChatOllama({
                model: "gemma2:2b",
            })
            // Ollama silently cuts off content beyond the context window size, so we add a buffer to have more explicit control.
            model.numCtx = Math.min(this.getContextWindowSize() * 2, baseModel.maxContext)
            return model
        })
    }

    get name(): ModelName {
        return "Ollama"
    }

    get supportsSystemPrompt(): boolean {
        return false
    }

    getContextWindowSize(): number {
        return this.config.contextWindowSize
    }
}
