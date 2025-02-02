import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatOllama } from "@langchain/ollama"
import { createRawSnippet, type Snippet } from "svelte"

type GeminiInterfaceConfig = { apiKey: string }

export class GeminiInterface extends LangchainBaseInterface<GeminiInterfaceConfig> {
    constructor(private apiKey: string) {
        super(
            () =>
                new ChatGoogleGenerativeAI({
                    model: "gemini-1.5-flash",
                    temperature: 0,
                    apiKey: apiKey,
                }),
        )
        this.apiKey = apiKey
    }

    getConfig(): GeminiInterfaceConfig {
        return { apiKey: this.apiKey }
    }

    setConfig(config: GeminiInterfaceConfig) {
        this.apiKey = config.apiKey
    }

    getContextWindowSize(): number {
        return 1_000_000
    }
}

type OllamaInterfaceConfig = { contextWindowSize: number }

export class OllamaInterface extends LangchainBaseInterface<OllamaInterfaceConfig> {
    constructor(private contextWindowSize: number) {
        super(
            () =>
                new ChatOllama({
                    model: "phi3:medium-128k",
                    temperature: 0,
                }),
        )
    }

    getConfig(): OllamaInterfaceConfig {
        return { contextWindowSize: this.contextWindowSize }
    }

    setConfig(config: OllamaInterfaceConfig) {
        this.contextWindowSize = config.contextWindowSize
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
