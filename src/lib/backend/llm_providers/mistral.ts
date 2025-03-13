import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"
import { ChatMistralAI } from "@langchain/mistralai"

type MistralInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class MistralInterface extends LangchainBaseInterface<MistralInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: MistralInterfaceConfig) {
        const model = MistralInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Mistral model: ${config.model}`)
        }
        super(config, () => [
            new ChatMistralAI({
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
        return "Mistral"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
