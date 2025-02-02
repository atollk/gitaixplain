import { GeminiInterface, OllamaInterface } from "$lib/backend/langchain_implementations.js"
import type { Snippet } from "svelte"

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

export abstract class AiInterface<Config> {
    abstract analyze(repoSummary: XMLDocument): Promise<AiResponse>

    abstract getConfig(): Config

    abstract setConfig(config: Config): void

    abstract getContextWindowSize(): number

    protected xmlToString(xml: XMLDocument): string {
        return new XMLSerializer().serializeToString(xml)
    }
}
