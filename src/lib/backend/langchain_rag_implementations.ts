import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { LangchainRAGInterface } from "$lib/backend/langchain_backend"
import { OllamaEmbeddings } from "@langchain/ollama"
import type { EmbeddingProviderName } from "$lib/models"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"
import { convertToConfig } from "$lib/backend/util"
import { AiRAGInterface } from "$lib/backend/ai_backend"

export function embeddingProviderNameToInterface(name: EmbeddingProviderName): {new(config: Record<string, unknown>): AiRAGInterface} {
    switch (name) {
        case "Gemini":
            return GeminiRAGInterface
        case "Voayge":
            // TODO
            throw new Error("not implemented")
        case "Ollama":
            return OllamaRAGInterface
        case "local":
            return LocalRAGInterface
        default:
            throw new Error(`Unknown chat provider ${name}`)
    }
}

type GeminiRAGInterfaceConfig = { readonly apiKey: string }

export class GeminiRAGInterface extends LangchainRAGInterface<GeminiRAGInterfaceConfig> {
    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<GeminiRAGInterfaceConfig>(_config, {
            apiKey: "",
        })
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

export class LocalRAGInterface extends LangchainRAGInterface<Record<never, never>> {
    constructor(config: Record<never, never>) {
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
    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<OllamaRAGInterfaceConfig>(_config, {
            contextWindowSize: 1000,
        })
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
