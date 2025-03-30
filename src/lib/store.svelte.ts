import { type AiInterface } from "$lib/backend/ai_backend"

export interface StoreData {
    aiInterface?: AiInterface
    gitUrl?: string
}

export const store: StoreData = $state({})
