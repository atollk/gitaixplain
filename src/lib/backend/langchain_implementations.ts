import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatOllama } from "@langchain/ollama"

export class GeminiInterface extends LangchainBaseInterface<{ apiKey: string }> {
    constructor(apiKey: string) {
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            temperature: 0,
            apiKey: apiKey,
        })
        super(model, { apiKey })
    }
}

export class OllamaInterface extends LangchainBaseInterface<{}> {
    constructor() {
        const model = new ChatOllama({
            model: "phi3:medium-128k",
            temperature: 0,
        })
        super(model, {})
    }
}
