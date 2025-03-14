import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import {
    AiChatInterface,
    AiRAGInterface,
} from "$lib/backend/ai_backend"
import { Embeddings } from "@langchain/core/embeddings"
import { VectorStore } from "@langchain/core/vectorstores"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import type { DocumentInterface } from "@langchain/core/documents"

export abstract class LangchainChatInterface<
    Config extends { [property: string]: unknown },
> extends AiChatInterface<Config> {
    private model?: BaseChatModel

    protected constructor(
        config: Config,
        protected readonly modelGen: () => BaseChatModel,
    ) {
        super(config)
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

        console.log("getChatResponse", messages)
        const response = await this.model!.invoke(messages)
        return response.content as string
    }
}

export abstract class LangchainRAGInterface<
    Config extends { [property: string]: unknown },
> extends AiRAGInterface<Config> {
    private embeddings?: Embeddings
    private vectorStore?: VectorStore
    private vectorStoreLength: number = 0

    protected constructor(
        config: Config,
        protected readonly modelGen: () => Embeddings,
    ) {
        super(config)
    }

    async getContext(query: string): Promise<string> {
        if (this.embeddings === undefined || this.vectorStore === undefined) {
            throw Error("Cannot getContext from an unitialized RAG object.")
        }

        // For some reason, we need to manually select the best match here even though it seems like LangChain should do that for us.
        const embed = await this.embeddings.embedQuery(query)
        const documents = await this.vectorStore.similaritySearchVectorWithScore(
            embed,
            this.vectorStoreLength,
        )
        documents.sort((lhs, rhs) => rhs[1] - lhs[1])
        const bestDocument = documents[0][0]
        return bestDocument.pageContent
    }

    async setDocuments(documents: DocumentInterface[]): Promise<void> {
        if (this.embeddings === undefined || this.vectorStore === undefined) {
            this.embeddings = this.modelGen()
            this.vectorStore = new MemoryVectorStore(this.embeddings)
            await this.vectorStore.addDocuments(documents)
            this.vectorStoreLength = documents.length
        } else {
            throw Error("Vector store already initialized.")
        }
    }
}
