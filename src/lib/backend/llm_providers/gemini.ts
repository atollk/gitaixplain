import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"

type GeminiInterfaceConfig = { readonly apiKey: string; readonly model: string }

export class GeminiInterface extends LangchainBaseInterface<GeminiInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: GeminiInterfaceConfig) {
        const model = GeminiInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Gemini model: ${config.model}`)
        }
        super(config, () => [
            new ChatGoogleGenerativeAI({
                model: config.model,
                apiKey: config.apiKey,
            }),
            new GoogleGenerativeAIEmbeddings({
                model: "text-embedding-004",
                apiKey: config.apiKey,
            }),
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
        return "Gemini"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
