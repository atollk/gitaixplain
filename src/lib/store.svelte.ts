import { type AiChatInterface, AiEmbeddingInterface } from "$lib/backend/ai_backend"

export interface StoreData {
    chatInterface?: AiChatInterface
    embeddingInterface?: AiEmbeddingInterface
    gitUrl?: string
}

export const store: StoreData = $state({})