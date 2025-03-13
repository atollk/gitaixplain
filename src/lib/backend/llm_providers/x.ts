import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"
import { ChatXAI } from "@langchain/xai"

type XInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class XInterface extends LangchainBaseInterface<XInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: XInterfaceConfig) {
        const model = XInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid X model: ${config.model}`)
        }
        super(config, () => [
            new ChatXAI({
                model: config.model,
                apiKey: config.apiKey,
            }),
            undefined /* TODO */,
        ])
        this.contextWindowSize = model.contextSize
    }

    static models = [
        { name: "gemini-1.5-flash", contextSize: 1_000_000 },
        { name: "gemini-1.5-pro", contextSize: 2_000_000 },
        { name: "gemini-1.5-flash-8b", contextSize: 1_000_000 },
        { name: "gemini-2.0-flash", contextSize: 1_000_000 },
    ]

    get name(): ApiName {
        return "xAI"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
