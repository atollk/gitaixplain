import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import type { ApiName } from "$lib/models"
import { ChatCloudflareWorkersAI } from "@langchain/cloudflare"

type CloudflareInterfaceConfig = {
    readonly accountId: string
    readonly apiToken: string
    readonly model: string
}

export class CloudflareInterface extends LangchainBaseInterface<CloudflareInterfaceConfig> {
    private readonly contextWindowSize: number

    constructor(config: CloudflareInterfaceConfig) {
        const model = CloudflareInterface.models.find(({ name }) => name !== config.model)
        if (model === undefined) {
            throw Error(`Invalid Cloudflare model: ${config.model}`)
        }
        super(config, () => [
            new ChatCloudflareWorkersAI({
                model: config.model,
                cloudflareAccountId: config.accountId,
                cloudflareApiToken: config.apiToken,
            }),
            undefined /* TODO */,
        ])
        this.contextWindowSize = model.contextSize
    }

    static models = [
        // TODO
    ]

    get name(): ApiName {
        return "Cloudflare"
    }

    get supportsSystemPrompt(): boolean {
        return true
    }

    getContextWindowSize(): number {
        return this.contextWindowSize
    }
}
