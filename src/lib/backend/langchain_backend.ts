import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { approximateTokens, countTokens, stripBackticks } from "$lib/backend/util"
import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import type { RepositoryDump } from "$lib/backend/repository_dump"
import { AiInterface, type AiRepoSummary } from "$lib/backend/ai_backend"
import { Embeddings } from "@langchain/core/embeddings"
import { VectorStore } from "@langchain/core/vectorstores"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import type { DocumentInterface } from "@langchain/core/documents"
import { CharacterTextSplitter } from "@langchain/textsplitters"

export abstract class LangchainBaseInterface<
    Config extends { [property: string]: any },
> extends AiInterface<Config> {
    private model?: BaseChatModel
    private embeddings?: Embeddings
    private vectorStore?: VectorStore
    private vectorStoreLength: number = 0

    protected constructor(
        config: Config,
        protected readonly modelGen: () => [BaseChatModel, Embeddings],
    ) {
        super(config)
    }

    protected abstract get supportsSystemPrompt(): boolean

    private initialize(): void {
        if (this.model !== undefined) return
        const [model, embeddings] = this.modelGen()
        this.model = model
        this.embeddings = embeddings
        this.vectorStore = new MemoryVectorStore(this.embeddings)
    }


    async getContext(query: string): Promise<string> {
        if (this.embeddings === undefined || this.vectorStore === undefined)
            throw Error("Cannot get documents from uninitialized vector store.")
        // For some reason, we need to manually select the best match here even though it seems like LangChain should do that for us.
        const embed = await this.embeddings.embedQuery(query)
        const documents = await this.vectorStore?.similaritySearchVectorWithScore(
            embed,
            this.vectorStoreLength,
        )
        documents.sort((lhs, rhs) => rhs[1] - lhs[1])
        const bestDocument = documents[0][0]
        return bestDocument.pageContent
    }

    async getChatResponse(
        systemMessage: string,
        chat: { text: string; byUser: boolean }[],
    ): Promise<string> {
        this.initialize()

        const messages = [
            this.supportsSystemPrompt
                ? new SystemMessage(systemMessage)
                : new HumanMessage(systemMessage),
        ]
        for (let { text, byUser } of chat) {
            messages.push(byUser ? new HumanMessage(text) : new AIMessage(text))
        }

        console.log("getChatResponse", messages)
        const response = await this.model!.invoke(messages)
        return response.content as string
    }

}
