import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"
import { ChatOpenAI } from "@langchain/openai"

type OpenInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class OpenInterface extends LangchainBaseInterface<OpenInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: OpenInterfaceConfig) {
        const model = OpenInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Open model: ${config.model}`)
        }
        super(config, () => [
            new ChatOpenAI({
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
        return "OpenAI"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
