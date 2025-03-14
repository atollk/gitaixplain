import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatGroq } from "@langchain/groq"
import { LangchainChatInterface } from "$lib/backend/langchain_backend"
import { ChatOllama } from "@langchain/ollama"
import type { ChatProviderName } from "$lib/models"
import { ChatAnthropic } from "@langchain/anthropic"
import { convertToConfig } from "$lib/backend/util"

type GeminiChatInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class GeminiChatInterface extends LangchainChatInterface<GeminiChatInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<GeminiChatInterfaceConfig>(_config, {
            apiKey: "",
            model: GeminiChatInterface.models[0].name,
        })
        const model = GeminiChatInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Gemini model: ${config.model}`)
        }
        super(
            config,
            () =>
                new ChatGoogleGenerativeAI({
                    model: config.model,
                    apiKey: config.apiKey,
                }),
        )
        this.contextWindowSize = model.contextSize
    }

    static models = [
        { name: "gemini-1.5-flash", contextSize: 1_000_000 },
        { name: "gemini-1.5-pro", contextSize: 2_000_000 },
        { name: "gemini-1.5-flash-8b", contextSize: 1_000_000 },
        { name: "gemini-2.0-flash", contextSize: 1_000_000 },
    ]

    get name(): ChatProviderName {
        return "Gemini"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}

export type GroqChatInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class GroqChatInterface extends LangchainChatInterface<GroqChatInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<GroqChatInterfaceConfig>(_config, {
            apiKey: "",
            model: GroqChatInterface.models[0].name,
        })
        const model = GroqChatInterface.models.find(({ name }) => name === config.model)
        if (model === undefined) {
            throw Error(`Invalid Groq model: ${config.model}`)
        }
        super(
            config,
            () =>
                new ChatGroq({
                    model: config.model,
                    apiKey: config.apiKey,
                }),
        )
        this.contextWindowSize = model.contextSize
    }

    static models = [
        { name: "gemma2-9b-it", contextSize: 8_000 },
        { name: "llama-3.3-70b-versatile", contextSize: 128_000 },
        { name: "llama-3.1-8b-instant", contextSize: 128_000 },
        { name: "llama-guard-3-8b", contextSize: 8_000 },
        { name: "llama3-70b-8192", contextSize: 8_000 },
        { name: "llama3-8b-8192", contextSize: 8_000 },
        { name: "mixtral-8x7b-32768", contextSize: 32_000 },
    ]

    get name(): ChatProviderName {
        return "Groq"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}

export type AnthropicChatInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class AnthropicChatInterface extends LangchainChatInterface<AnthropicChatInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<AnthropicChatInterfaceConfig>(_config, {
            apiKey: "",
            model: AnthropicChatInterface.models[0].name,
        })
        const model = AnthropicChatInterface.models.find(({ name }) => name === config.model)
        if (model === undefined) {
            throw Error(`Invalid Anthropic model: ${config.model}`)
        }
        super(
            config,
            () =>
                new ChatAnthropic({
                    model: config.model,
                    apiKey: config.apiKey,
                }),
        )
        this.contextWindowSize = model.contextSize
    }

    static models = [
        { name: "claude-3-7-sonnet-20250219", contextSize: 200_000 },
        { name: "claude-3-5-haiku-20241022", contextSize: 200_000 },
        { name: "claude-3-opus-20240229", contextSize: 200_000 },
        { name: "claude-3-haiku-20240307", contextSize: 200_000 },
    ]

    get name(): ChatProviderName {
        return "Anthropic"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
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
}
