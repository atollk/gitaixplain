import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatOllama } from "@langchain/ollama"

export function geminiInterface(apiKey: string): LangchainBaseInterface<{ apiKey: string }> {
    const model = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash",
        temperature: 0,
        apiKey: apiKey,
    })
    return new LangchainBaseInterface(model, { apiKey }, 1_000_000)
}

export function ollamaInterface(): LangchainBaseInterface<{}> {
    const model = new ChatOllama({
        model: "phi3:medium-128k",
        temperature: 0,
    })
    return new LangchainBaseInterface(model, {}, 128_000)
}
