import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import { AiChatInterface, AiEmbeddingInterface } from "$lib/backend/ai_backend"
import { Embeddings } from "@langchain/core/embeddings"
import { VectorStore } from "@langchain/core/vectorstores"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import type { DocumentInterface } from "@langchain/core/documents"
import { z } from "zod"
import { countTokens } from "$lib/backend/util"

export abstract class LangchainChatInterface<
    Config extends Record<string, unknown>,
> extends AiChatInterface {
    private model?: BaseChatModel

    protected constructor(
        public readonly config: Config,
        protected readonly modelGen: () => BaseChatModel,
    ) {
        super()
    }

    protected abstract get supportsSystemPrompt(): boolean

    async getChatResponse(
        systemMessage: string,
        chat: { text: string; byUser: boolean }[],
    ): Promise<string> {
        if (this.model === undefined) {
            this.model = this.modelGen()
        }

        const messages = [
            this.supportsSystemPrompt
                ? new SystemMessage(systemMessage)
                : new HumanMessage(systemMessage),
        ]
        for (const { text, byUser } of chat) {
            messages.push(byUser ? new HumanMessage(text) : new AIMessage(text))
        }

        console.log(
            "getChatResponse",
            messages,
            countTokens(messages.map((m) => m.content).join("\n")),
        )
        const response = await this.model!.invoke(messages)
        return response.content as string
    }

    async getChatResponseWithStructure<T extends z.ZodObject<U>, U extends z.ZodRawShape>(
        systemMessage: string,
        chat: {
            text: string
            byUser: boolean
        }[],
        structure: T,
    ): Promise<z.infer<T>> {
        if (this.model === undefined) {
            this.model = this.modelGen()
        }

        const messages = [
            this.supportsSystemPrompt
                ? new SystemMessage(systemMessage)
                : new HumanMessage(systemMessage),
        ]
        for (const { text, byUser } of chat) {
            messages.push(byUser ? new HumanMessage(text) : new AIMessage(text))
        }

        console.log("getChatResponseWithStructure", messages)
        return await this.model!.withStructuredOutput(structure).invoke(messages)
    }

    reset(): void {
        this.model = undefined
    }
}

export abstract class LangchainEmbeddingInterface<
    Config extends Record<string, unknown>,
> extends AiEmbeddingInterface {
    private embeddings?: Embeddings
    private vectorStore?: VectorStore
    private vectorStoreLength: number = 0

    protected constructor(
        public readonly config: Config,
        protected readonly modelGen: () => Embeddings,
    ) {
        super()
    }

    async getContext(query: string, maxK?: number): Promise<string[]> {
        if (this.embeddings === undefined || this.vectorStore === undefined) {
            throw Error("Cannot getContext from an unitialized Embedding object.")
        }

        // For some reason, we need to manually select the best match here even though it seems like LangChain should do that for us.
        const embed = await this.embeddings.embedQuery(query)
        const documents = await this.vectorStore.similaritySearchVectorWithScore(
            embed,
            this.vectorStoreLength,
        )
        documents.sort((lhs, rhs) => rhs[1] - lhs[1])
        const bestDocuments: Map<string, string> = new Map()
        for (const doc of documents) {
            if (maxK !== undefined && bestDocuments.size >= maxK)
                break
            const metadata = doc[0].metadata as {path: string, fullContent: string}
            if (!bestDocuments.has(metadata.path))
                bestDocuments.set(metadata.path, `<file=${metadata.path}>\n${metadata.fullContent}`)
        }
        return bestDocuments.values().toArray()
    }

    async setDocuments(documents: DocumentInterface[]): Promise<void> {
        if (this.embeddings === undefined || this.vectorStore === undefined) {
            console.log("setDocuments", documents)
            this.embeddings = this.modelGen()
            this.vectorStore = new MemoryVectorStore(this.embeddings)
            await this.vectorStore.addDocuments(documents)
            this.vectorStoreLength = documents.length
        } else {
            throw Error("Vector store already initialized.")
        }
    }

    reset(): void {
        this.embeddings = undefined
        this.vectorStore = undefined
    }
}
