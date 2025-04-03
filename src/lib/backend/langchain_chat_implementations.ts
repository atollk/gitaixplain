import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatGroq } from "@langchain/groq"
import { LangchainChatInterface } from "$lib/backend/langchain_backend"
import { ChatOllama } from "@langchain/ollama"
import type { ChatProviderName } from "$lib/models"
import { ChatAnthropic } from "@langchain/anthropic"
import { type AiChatInterface, AiEmbeddingInterface } from "$lib/backend/ai_backend"
import { convertToConfig } from "$lib/backend/util.svelte"
import {
    GeminiEmbeddingInterface,
    OllamaEmbeddingInterface,
} from "$lib/backend/langchain_embedding_implementations"

export function chatProviderNameToInterface(name: ChatProviderName): {
    new (config: Record<string, unknown>): AiChatInterface
} {
    switch (name) {
        case "Gemini":
            return GeminiChatInterface
        case "Groq":
            return GroqChatInterface
        case "Anthropic":
            return AnthropicChatInterface
        case "Ollama":
            return OllamaChatInterface
        default:
            throw new Error(`Unknown chat provider ${name}`)
    }
}

type GeminiChatInterfaceConfig = { apiKey: string; modelName: string }

export class GeminiChatInterface extends LangchainChatInterface<GeminiChatInterfaceConfig> {
    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<GeminiChatInterfaceConfig>(_config, {
            apiKey: "",
            modelName: GeminiChatInterface.models[0].name,
        })
        super(
            config,
            () =>
                new ChatGoogleGenerativeAI({
                    model: config.modelName,
                    apiKey: config.apiKey,
                }),
        )
    }

    static models = [
        { name: "gemini-1.5-flash", contextSize: 1_000_000 },
        { name: "gemini-1.5-pro", contextSize: 1_000_000 },
        { name: "gemini-1.5-flash-8b", contextSize: 1_000_000 },
        { name: "gemini-2.0-flash", contextSize: 1_000_000 },
        { name: "gemini-2.5-pro-exp-03-25", contextSize: 1_000_000 },
    ]

    get modelInfo(): (typeof GeminiChatInterface.models)[number] {
        const model = GeminiChatInterface.models.find(({ name }) => name === this.config.modelName)
        if (!model) throw Error(`Invalid Gemini model: ${this.config.modelName}`)
        return model
    }

    get name(): ChatProviderName {
        return "Gemini"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.modelInfo.contextSize
    }

    providesEmbeddings(): boolean {
        return true
    }

    getEmbeddingProvider(): AiEmbeddingInterface {
        return new GeminiEmbeddingInterface({ apiKey: this.config.apiKey })
    }
}

export type GroqChatInterfaceConfig = { apiKey: string; modelName: string }

export class GroqChatInterface extends LangchainChatInterface<GroqChatInterfaceConfig> {
    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<GroqChatInterfaceConfig>(_config, {
            apiKey: "",
            modelName: GroqChatInterface.models[0].name,
        })
        super(
            config,
            () =>
                new ChatGroq({
                    model: config.modelName,
                    apiKey: config.apiKey,
                }),
        )
    }

    static models = [
        { name: "gemma2-9b-it", contextSize: 8_000 },
        { name: "llama-3.3-70b-versatile", contextSize: 128_000 },
        { name: "llama-3.1-8b-instant", contextSize: 128_000 },
        { name: "llama-guard-3-8b", contextSize: 8_000 },
        { name: "llama3-70b-8192", contextSize: 8_000 },
        { name: "llama3-8b-8192", contextSize: 8_000 },
        { name: "mistral-saba-24b", contextSize: 32_000 },
    ]

    get modelInfo(): (typeof GroqChatInterface.models)[number] {
        const model = GroqChatInterface.models.find(({ name }) => name === this.config.modelName)
        if (!model) throw Error(`Invalid Groq model: ${this.config.modelName}`)
        return model
    }

    get name(): ChatProviderName {
        return "Groq"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.modelInfo.contextSize
    }

    providesEmbeddings(): boolean {
        return false
    }

    getEmbeddingProvider(): AiEmbeddingInterface {
        throw new Error("Cannot create embedding interface from Groq.")
    }
}

export type AnthropicChatInterfaceConfig = { apiKey: string; modelName: string }

export class AnthropicChatInterface extends LangchainChatInterface<AnthropicChatInterfaceConfig> {
    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<AnthropicChatInterfaceConfig>(_config, {
            apiKey: "",
            modelName: AnthropicChatInterface.models[0].name,
        })
        const corsHeaders = {} //"anthropic-dangerous-direct-browser-access": "true"}
        super(
            config,
            () =>
                new ChatAnthropic({
                    model: config.modelName,
                    apiKey: config.apiKey,
                    clientOptions: {
                        defaultHeaders: corsHeaders,
                    },
                }),
        )
    }

    static models = [
        { name: "claude-3-7-sonnet-20250219", contextSize: 200_000 },
        { name: "claude-3-5-haiku-20241022", contextSize: 200_000 },
        { name: "claude-3-opus-20240229", contextSize: 200_000 },
        { name: "claude-3-haiku-20240307", contextSize: 200_000 },
    ]

    get modelInfo(): (typeof AnthropicChatInterface.models)[number] {
        const model = AnthropicChatInterface.models.find(
            ({ name }) => name === this.config.modelName,
        )
        if (!model) throw Error(`Invalid Anthropic model: ${this.config.modelName}`)
        return model
    }

    get name(): ChatProviderName {
        return "Anthropic"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.modelInfo.contextSize
    }

    providesEmbeddings(): boolean {
        return false
    }

    getEmbeddingProvider(): AiEmbeddingInterface {
        throw new Error("Cannot create embedding interface from Anthropic.")
    }
}

export type OllamaChatInterfaceConfig = { contextWindowSize: number }

export class OllamaChatInterface extends LangchainChatInterface<OllamaChatInterfaceConfig> {
    static models = { ["gemma2:2b"]: { maxContext: 8192 } }

    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<OllamaChatInterfaceConfig>(_config, {
            contextWindowSize: 1000,
        })
        super(config, () => {
            const baseModel = OllamaChatInterface.models["gemma2:2b"]

            const corsHeaders = new Headers([["x-stainless-retry-count", ""]])

            const model = new ChatOllama({
                model: "gemma2:2b",
                checkOrPullModel: true,
                headers: corsHeaders,
            })
            // Ollama silently cuts off content beyond the context window size, so we add a buffer to have more explicit control.
            model.numCtx = Math.min(this.getContextWindowSize() * 2, baseModel.maxContext)
            return model
        })
    }

    get name(): ChatProviderName {
        return "Ollama"
    }

    get supportsSystemPrompt(): boolean {
        return false
    }

    getContextWindowSize(): number {
        return this.config.contextWindowSize
    }

    providesEmbeddings(): boolean {
        return true
    }

    getEmbeddingProvider(): AiEmbeddingInterface {
        return new OllamaEmbeddingInterface({})
    }
}
