import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { LangchainEmbeddingInterface } from "$lib/backend/langchain_backend"
import { OllamaEmbeddings } from "@langchain/ollama"
import type { EmbeddingProviderName } from "$lib/models"
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"
import { AiEmbeddingInterface } from "$lib/backend/ai_backend"
import { convertToConfig } from "$lib/backend/util.svelte"
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage"

export function embeddingProviderNameToInterface(name: EmbeddingProviderName): {
    new (config: Record<string, unknown>): AiEmbeddingInterface
} {
    switch (name) {
        case "Gemini":
            return GeminiEmbeddingInterface
        case "Voyage":
            return VoyageEmbeddingInterface
        case "Ollama":
            return OllamaEmbeddingInterface
        case "local":
            return LocalEmbeddingInterface
        default:
            throw new Error(`Unknown chat provider ${name}`)
    }
}

type GeminiEmbeddingInterfaceConfig = { apiKey: string }

export class GeminiEmbeddingInterface extends LangchainEmbeddingInterface<GeminiEmbeddingInterfaceConfig> {
    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<GeminiEmbeddingInterfaceConfig>(_config, {
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

export type VoyageEmbeddingInterfaceConfig = { apiKey: string }

export class VoyageEmbeddingInterface extends LangchainEmbeddingInterface<VoyageEmbeddingInterfaceConfig> {
    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<VoyageEmbeddingInterfaceConfig>(_config, {
            apiKey: "",
        })
        super(
            config,
            () =>
                new VoyageEmbeddings({
                    modelName: "voyage-code-3",
                    apiKey: config.apiKey,
                }),
        )
    }

    get name(): EmbeddingProviderName {
        return "Voyage"
    }
}

export type OllamaEmbeddingInterfaceConfig = { contextWindowSize: number }

export class OllamaEmbeddingInterface extends LangchainEmbeddingInterface<OllamaEmbeddingInterfaceConfig> {
    constructor(_config: Record<string, unknown>) {
        const config = convertToConfig<OllamaEmbeddingInterfaceConfig>(_config, {
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

export class LocalEmbeddingInterface extends LangchainEmbeddingInterface<Record<never, never>> {
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
