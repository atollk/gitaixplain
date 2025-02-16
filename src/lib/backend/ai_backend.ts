import type { RepositoryDump } from "$lib/backend/repo_summary_backend"
import type { ApiName } from "$lib/models"

export interface Graph {
    nodes: string[]
    edges: { from: string; to: string; label?: string }[]
}

export interface AiRepoSummary {
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

    abstract getContext(query: string): Promise<string>

    abstract getChatResponse(
        systemMessage: string,
        chat: { text: string; byUser: boolean }[],
    ): Promise<string>

    abstract analyzeRepo(repoDump: RepositoryDump): Promise<AiRepoSummary>

    abstract getContextWindowSize(): number
}
