import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGroq } from "@langchain/groq"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"
import type { ApiName } from "$lib/models"

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