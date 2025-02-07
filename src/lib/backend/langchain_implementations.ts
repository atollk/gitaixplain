import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { LangchainBaseInterface } from "$lib/backend/langchain_backend"
import { ChatOllama } from "@langchain/ollama"
import type { FormFields } from "$lib/components/util/ModelConfigForm.svelte"

type GeminiInterfaceConfig = { apiKey: string }

export class GeminiInterface extends LangchainBaseInterface<GeminiInterfaceConfig> {
    constructor(apiKey: string) {
        super(
            { apiKey },
            () =>
                new ChatGoogleGenerativeAI({
                    model: "gemini-1.5-flash",
                    temperature: 0,
                    apiKey: apiKey,
                }),
        )
    }

    getContextWindowSize(): number {
        return 1_000_000
    }

    getConfigFormFields(): FormFields<GeminiInterfaceConfig> {
        return {
            apiKey: {
                displayName: "API Key",
                inputElementType: "text",
                validate: (value: string) => value.length > 0,
            },
        }
    }
}

type OllamaInterfaceConfig = { contextWindowSize: number }

export class OllamaInterface extends LangchainBaseInterface<OllamaInterfaceConfig> {
    constructor(contextWindowSize: number) {
        super(
            { contextWindowSize },
            () =>
                new ChatOllama({
                    model: "phi3:medium-128k",
                    temperature: 0,
                }),
        )
    }

    getContextWindowSize(): number {
        return this.config.contextWindowSize
    }

    getConfigFormFields(): FormFields<OllamaInterfaceConfig> {
        return {
            contextWindowSize: {
                inputElementType: "number",
                displayName: "Context Window Size",
                validate: (value: string) => !isNaN(parseInt(value)),
            },
        }
    }
}
