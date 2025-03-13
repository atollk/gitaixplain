import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama"
import type { ApiName } from "$lib/models"


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
