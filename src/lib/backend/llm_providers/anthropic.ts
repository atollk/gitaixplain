import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"
import { ChatAnthropic } from "@langchain/anthropic"

type AnthropicInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class AnthropicInterface extends LangchainBaseInterface<AnthropicInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: AnthropicInterfaceConfig) {
        const model = AnthropicInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Anthropic model: ${config.model}`)
        }
        super(config, () => [
            new ChatAnthropic({
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
        return "Anthropic"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
