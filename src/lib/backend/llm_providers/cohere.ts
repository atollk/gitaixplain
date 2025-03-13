import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"
import { ChatCohere } from "@langchain/cohere"

type CohereInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class CohereInterface extends LangchainBaseInterface<CohereInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: CohereInterfaceConfig) {
        const model = CohereInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Cohere model: ${config.model}`)
        }
        super(config, () => [
            new ChatCohere({
                model: config.model,
                apiKey: config.apiKey,
            }),
            undefined /* TODO */,
        ])
        this.contextWindowSize = model.contextSize
    }

    static models = [
        // TODO
    ]

    get name(): ApiName {
        return "Cohere"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
