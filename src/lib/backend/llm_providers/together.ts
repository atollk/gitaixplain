import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"
import { ChatTogetherAI } from "@langchain/community/dist/chat_models/togetherai"

type TogetherInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class TogetherInterface extends LangchainBaseInterface<TogetherInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: TogetherInterfaceConfig) {
        const model = TogetherInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Together model: ${config.model}`)
        }
        super(config, () => [
            new ChatTogetherAI({
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
        return "Together"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
