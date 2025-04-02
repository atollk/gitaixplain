import { AiInterface } from "$lib/backend/ai_backend"
import type { ChatProviderName, EmbeddingProviderName } from "$lib/models"
import { chatProviderNameToInterface } from "$lib/backend/langchain_chat_implementations"
import { embeddingProviderNameToInterface } from "$lib/backend/langchain_embedding_implementations"

const PROVIDER_CONFIG_KEY = "providerConfig"

function state<T>(value: T): T {
    const x = $state<T>(value)
    return x
}

export class AppStore {

    constructor() {
        const providerConfig = localStorage.getItem(PROVIDER_CONFIG_KEY)
        if (providerConfig) {
            this.data.aiInterface = state(aiInterfaceFromJson(providerConfig))
            this.data.useLocalStorage = state(true)
        }
    }

    private data: {
        aiInterface?: AiInterface,
        gitUrl: string,
        useLocalStorage: boolean
    } = $state({useLocalStorage: false, gitUrl: ""})

    get aiInterface(): AiInterface | undefined {
        return this.data.aiInterface
    }

    set aiInterface(value: AiInterface | undefined) {
        this.data.aiInterface = state(value)
        if (!this.data.useLocalStorage || !this.data.aiInterface) {
            localStorage.removeItem(PROVIDER_CONFIG_KEY)
        } else {
            localStorage.setItem(PROVIDER_CONFIG_KEY, aiInterfaceToJson(this.data.aiInterface))
        }
    }

    get gitUrl(): string {
        return this.data.gitUrl
    }

    set gitUrl(value: string) {
        this.data.gitUrl = state(value)
    }

    get useLocalStorage(): boolean {
        return this.data.useLocalStorage
    }

    set useLocalStorage(value: boolean) {
        this.data.useLocalStorage = state(value)
        if (!this.data.useLocalStorage) {
            localStorage.clear()
        }
    }
}

export const appStore = new AppStore()

interface AiInterfaceJson {
    chatProvider: {
        name: ChatProviderName
        config: Record<string, unknown>
    }
    embeddingProvider: {
        name: EmbeddingProviderName
        config: Record<string, unknown>
    } | null
}

function aiInterfaceToJson(obj: AiInterface): string {
    const data = <AiInterfaceJson>{
        chatProvider: {
            name: obj.chatInterface.name,
            config: obj.chatInterface.config,
        },
        embeddingProvider: obj.embeddingInterface
            ? {
                  name: obj.embeddingInterface.name,
                  config: obj.embeddingInterface.config,
              }
            : null,
    }
    return JSON.stringify(data)
}

function aiInterfaceFromJson(json: string): AiInterface {
    const data: AiInterfaceJson = JSON.parse(json)
    const chatInterface = new (chatProviderNameToInterface(data.chatProvider.name))(
        data.chatProvider.config,
    )
    const embeddingInterface = data.embeddingProvider
        ? new (embeddingProviderNameToInterface(data.embeddingProvider.name))(
              data.embeddingProvider.config,
          )
        : null
    return new AiInterface(chatInterface, embeddingInterface)
}
