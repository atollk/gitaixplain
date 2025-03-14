import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { LangchainRAGInterface } from "$lib/backend/langchain_backend"
import { OllamaEmbeddings } from "@langchain/ollama"
import type { EmbeddingProviderName } from "$lib/models"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"

type GeminiRAGInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class GeminiRAGInterface extends LangchainRAGInterface<GeminiRAGInterfaceConfig> {
    constructor(config: GeminiRAGInterfaceConfig) {
        super(
            config,
            () =>
                new GoogleGenerativeAIEmbeddings({
                    model: "text-embedding-004",
                    apiKey: config.apiKey,
                }),
        )
    }

    get name(): EmbeddingProviderName {
        return "Gemini"
    }
}

export class LocalRAGInterface extends LangchainRAGInterface<never> {
    constructor(config: never) {
        super(
            config,
            () =>
                // TODO: do the embeddings setup async
                new HuggingFaceTransformersEmbeddings({ model: "Xenova/all-MiniLM-L6-v2" }),
        )
    }

    get name(): EmbeddingProviderName {
        return "local"
    }
}

export type OllamaRAGInterfaceConfig = { contextWindowSize: number }

export class OllamaRAGInterface extends LangchainRAGInterface<OllamaRAGInterfaceConfig> {
    constructor(config: OllamaRAGInterfaceConfig) {
        super(config, () => {
            const corsHeaders = new Headers([["x-stainless-retry-count", ""]])
            return new OllamaEmbeddings({
                model: "mxbai-embed-large",
                headers: corsHeaders,
            })
        })
    }

    get name(): EmbeddingProviderName {
        return "Ollama"
    }
}
