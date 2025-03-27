import { type AiChatInterface, AiRAGInterface } from "$lib/backend/ai_backend"

export interface StoreData {
    chatInterface?: AiChatInterface
    ragInterface?: AiRAGInterface
    gitUrl?: string
}

export const store: StoreData = $state({})