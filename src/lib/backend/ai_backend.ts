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

export abstract class AiChatInterface<Config extends { [property: string]: unknown } = never> {
    protected constructor(readonly config: Config) {}

    abstract get name(): ChatProviderName

    abstract getContextWindowSize(): number

    abstract getChatResponse(
        systemMessage: string,
        chat: { text: string; byUser: boolean }[],
    ): Promise<string>
}

export abstract class AiRAGInterface<Config extends { [property: string]: unknown } = never> {
    protected constructor(readonly config: Config) {}

    abstract get name(): EmbeddingProviderName

    abstract getContext(query: string): Promise<string>

    abstract setDocuments(documents: DocumentInterface[]): Promise<void>
}

export class AiInterface {
    constructor(
        readonly chatAi: AiChatInterface,
        readonly ragAi: AiRAGInterface
    ) {}
}
