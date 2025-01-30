import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { AiInterface, type AiResponse } from "$lib/backend/ai_backend"
import { stripBackticks } from "$lib/backend/backend"
import { BaseChatModel } from "@langchain/core/language_models/chat_models"

export class LangchainBaseInterface<ModelConfig> extends AiInterface {
    constructor(
        protected readonly model: BaseChatModel,
        protected readonly modelConfig: ModelConfig,
    ) {
        super()
    }

    async analyze(repoSummary: XMLDocument): Promise<AiResponse> {
        console.log(this.xmlToString(repoSummary))
        const messages = [
            new SystemMessage(
                `
Analyze the following Git repository XML data and generate a structured analysis in JSON format. The output must strictly follow this schema:

{
  "summary": {
    "purpose": "Single paragraph describing the project's core purpose",
  },
  "componentAnalysis": {
    "flowGraph": "Mermaid diagram code showing key components and their interactions",
    "entryPoints": ["Array of main entry point files"],
  },
  "keyFiles": [
    {
      "path": "File path",
      "purpose": "Brief description of file's role",
      "importance": "Why this file is critical",
      "connections": ["Related files"]
    }
  ],
  "usagePaths": {
    "setup": ["Step-by-step setup instructions"],
    "mainFlow": "Description of primary data/control flow through system",
    "commonPatterns": ["Recurring code patterns worth noting"]
  },
  "securityConsiderations": {
    "entryPoints": ["Security-critical entry points"],
    "dataFlow": ["Sensitive data paths"],
    "dependencies": ["Security-relevant dependencies"]
  }
}

Ground rules:
1. Keep all text fields concise and information-dense
2. Include only information that can be confidently inferred from the repository
3. In keyFiles, prioritize files that are essential for understanding the system architecture

XML data follows:
				`,
            ),
            new HumanMessage(this.xmlToString(repoSummary)),
        ]

        const response = await this.model.invoke(messages)
        let responseContent = response.content as string
        responseContent = stripBackticks(responseContent, "json")
        const parsedResponse: AiResponse = JSON.parse(responseContent)
        if (parsedResponse.componentAnalysis !== undefined) {
            parsedResponse.componentAnalysis.flowGraph = stripBackticks(
                parsedResponse?.componentAnalysis?.flowGraph ?? "",
                "mermaid",
            )
        }

        console.log(parsedResponse)
        return parsedResponse
    }
}
