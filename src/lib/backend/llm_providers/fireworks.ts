import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"
import { ChatFireworks } from "@langchain/community/dist/chat_models/fireworks"

type FireworksInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class FireworksInterface extends LangchainBaseInterface<FireworksInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: FireworksInterfaceConfig) {
        const model = FireworksInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Fireworks model: ${config.model}`)
        }
        super(config, () => [
            new ChatFireworks({
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
        return "Fireworks"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
