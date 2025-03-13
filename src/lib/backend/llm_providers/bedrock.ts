import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"
import { ChatBedrockConverse } from "@langchain/aws"

type BedrockInterfaceConfig = {
    readonly awsRegion: string
    readonly accessKeyId: string
    readonly secretAccessKey: string
    readonly model: string
}

export class BedrockInterface extends LangchainBaseInterface<BedrockInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: BedrockInterfaceConfig) {
        const model = BedrockInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Bedrock model: ${config.model}`)
        }
        super(config, () => [
            new ChatBedrockConverse({
                model: config.model,
                region: config.awsRegion,
                credentials: {
                    accessKeyId: config.accessKeyId,
                    secretAccessKey: config.secretAccessKey,
                },
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
        return "Bedrock"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
