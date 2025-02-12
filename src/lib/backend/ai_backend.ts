import type { RepositorySummary } from "$lib/backend/repo_summary_backend"
import type { ApiName } from "$lib/models"

export interface Graph {
    nodes: { id: string; label: string }[]
    edges: { from: string; to: string; label?: string }[]
}

export interface AiResponse {
    summary?: {
        purpose?: string
    }
    componentAnalysis?: {
        flowGraph?: Graph
    }
    keyFiles?: {
        path?: string
        purpose?: string
        importance?: string
        connections?: string[]
    }[]
    usagePaths?: {
        setup?: string[]
        mainFlow?: string
    }
    dependencies?: string[]
}

export abstract class AiInterface<Config extends { [property: string]: any }> {
    protected constructor(readonly config: Config) {}

    abstract get name(): ApiName

    abstract getChatResponse(chat: { text: string; byUser: boolean }[]): string

    abstract analyze(repoSummary: RepositorySummary): Promise<AiResponse>

    abstract getContextWindowSize(): number
}
