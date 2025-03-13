import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { ChatGroq } from "@langchain/groq"
import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama"
import type { ApiName } from "$lib/models"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"
import { ChatAnthropic } from "@langchain/anthropic"

type GeminiInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class GeminiInterface extends LangchainBaseInterface<GeminiInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: GeminiInterfaceConfig) {
        const model = GeminiInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Gemini model: ${config.model}`)
        }
        super(config, () => [
            new ChatGoogleGenerativeAI({
                model: config.model,
                apiKey: config.apiKey,
            }),
            new GoogleGenerativeAIEmbeddings({
                model: "text-embedding-004",
                apiKey: config.apiKey,
            }),
        ])
        this.contextWindowSize = model.contextSize
    }

    static models = [
        { name: "gemini-1.5-flash", contextSize: 1_000_000 },
        { name: "gemini-1.5-pro", contextSize: 2_000_000 },
        { name: "gemini-1.5-flash-8b", contextSize: 1_000_000 },
        { name: "gemini-2.0-flash", contextSize: 1_000_000 },
    ]

    get name(): ApiName {
        return "Gemini"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}

export type GroqInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class GroqInterface extends LangchainBaseInterface<GroqInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: GroqInterfaceConfig) {
        const model = GroqInterface.models.find(({ name }) => name === config.model)
        if (model === undefined) {
            throw Error(`Invalid Groq model: ${config.model}`)
        }
        super(config, () => [
            new ChatGroq({
                model: config.model,
                apiKey: config.apiKey,
            }),
            // TODO: do the embeddings setup async
            new HuggingFaceTransformersEmbeddings({ model: "Xenova/all-MiniLM-L6-v2" }),
        ])
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

    get name(): ApiName {
        return "Groq"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}

export type AnthropicInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class AnthropicInterface extends LangchainBaseInterface<AnthropicInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: AnthropicInterfaceConfig) {
        const model = AnthropicInterface.models.find(({ name }) => name === config.model)
        if (model === undefined) {
            throw Error(`Invalid Anthropic model: ${config.model}`)
        }
        super(config, () => [
            new ChatAnthropic({
                model: config.model,
                apiKey: config.apiKey,
            }),
            // TODO: do the embeddings setup async
            new HuggingFaceTransformersEmbeddings({ model: "Xenova/all-MiniLM-L6-v2" }),
        ])
        this.contextWindowSize = model.contextSize
    }

    static models = [
        {name: "claude-3-7-sonnet-20250219", contextSize: 200_000 },
        {name: "claude-3-5-haiku-20241022", contextSize: 200_000 },
        {name: "claude-3-opus-20240229", contextSize: 200_000 },
        {name: "claude-3-haiku-20240307", contextSize: 200_000 },
    ]

    get name(): ApiName {
        return "Anthropic"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}


export type OllamaInterfaceConfig = { contextWindowSize: number }

export class OllamaInterface extends LangchainBaseInterface<OllamaInterfaceConfig> {
    static models = { ["gemma2:2b"]: { maxContext: 8192 } }

    constructor(config: OllamaInterfaceConfig) {
        super(config, () => {
            const baseModel = OllamaInterface.models["gemma2:2b"]

            const corsHeaders = new Headers([["x-stainless-retry-count", ""]])

            const model = new ChatOllama({
                model: "gemma2:2b",
                checkOrPullModel: true,
                headers: corsHeaders,
            })
            // Ollama silently cuts off content beyond the context window size, so we add a buffer to have more explicit control.
            model.numCtx = Math.min(this.getContextWindowSize() * 2, baseModel.maxContext)

            const embeddings = new OllamaEmbeddings({
                model: "mxbai-embed-large",
                headers: corsHeaders,
            })
            return [model, embeddings]
        })
    }

    get name(): ApiName {
        return "Ollama"
    }

    get supportsSystemPrompt(): boolean {
        return false
    }

    getContextWindowSize(): number {
        return this.config.contextWindowSize
    }
}
