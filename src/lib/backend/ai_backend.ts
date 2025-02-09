import type { RepositorySummary } from "$lib/backend/repo_summary_backend"
import type { ApiName } from "$lib/models"

export interface AiResponse {
    summary?: {
        purpose?: string
    }
    componentAnalysis?: {
        flowGraph?: string
        entryPoints?: string[]
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
        commonPatterns?: string[]
    }
    securityConsiderations?: {
        entryPoints?: string[]
        dataFlow?: string[]
        dependencies?: string[]
    }
}

export abstract class AiInterface<Config extends { [property: string]: any }> {
    protected constructor(readonly config: Config) {}

    abstract get name(): ApiName

    abstract analyze(repoSummary: RepositorySummary): Promise<AiResponse>

    abstract getContextWindowSize(): number
}
