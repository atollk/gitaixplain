import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { AiInterface, type AiResponse } from "$lib/backend/ai_backend"
import { stripBackticks } from "$lib/backend/util"
import { BaseChatModel } from "@langchain/core/language_models/chat_models"

export abstract class LangchainBaseInterface<Config> extends AiInterface<Config> {
    private model?: BaseChatModel

    protected constructor(
        config: Config,
        protected readonly modelGen: () => BaseChatModel,
    ) {
        super(config)
    }

    // async analyze(repoSummary: string): Promise<AiResponse> {
    //     return Promise.resolve({})
    // }

    async analyze(repoSummary: string): Promise<AiResponse> {
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
            new HumanMessage(repoSummary),
        ]

        if (this.model === undefined) this.model = this.modelGen()

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
