import type { ChatProviderName, EmbeddingProviderName } from "$lib/models"
import type { DocumentInterface } from "@langchain/core/documents"

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

export abstract class AiChatInterface {
    abstract get name(): ChatProviderName
    abstract get config(): Record<string, unknown>

    abstract getContextWindowSize(): number

    abstract getChatResponse(
        systemMessage: string,
        chat: { text: string; byUser: boolean }[],
    ): Promise<string>

    abstract providesEmbeddings(): boolean
    abstract getEmbeddingProvider(): AiEmbeddingInterface

    abstract reset(): void
}

export abstract class AiEmbeddingInterface {
    abstract get name(): EmbeddingProviderName
    abstract get config(): Record<string, unknown>

    abstract getContext(query: string): Promise<string>

    abstract setDocuments(documents: DocumentInterface[]): Promise<void>

    abstract reset(): void
}

export class AiInterface {
    constructor(
        readonly chatInterface: AiChatInterface,
        readonly embeddingInterface: AiEmbeddingInterface | null,
    ) {}
}
