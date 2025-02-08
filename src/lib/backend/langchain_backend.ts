import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { AiInterface, type AiResponse } from "$lib/backend/ai_backend"
import { countTokens, stripBackticks } from "$lib/backend/util"
import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import type { RepositorySummary } from "$lib/backend/repo_summary_backend"

const MESSAGE_SUMMARIZE_PARTS = `
You will be provided with an XML file describing parts of a Git repository. 
Your job is to summarize the content you are given in a way that it can later be given to you again with other summaries to get an understanding of the entire repository.
Therefore, analyze the following information in the upcoming XML:
- Dependencies on other important files or packages.
- Key functionalities of the file.
- Exported structure, such as public classes or functions, that can be used by other parts of the repository.
- Relation to other components of the repository as a whole.

The XML will contain three types of tags:
- The "paths" tag will contain a list of all filenames in the Git repository.
- The "file" tag will have an attribute for that file's path and contain the file's contents.
- The "summary" tag will have an attribute for a file's or directory's path and contain the summary for that part created previously by you.
`

const MESSAGE_ANALYZE_ENTIRE_REPO = `
Analyze the following Git repository XML data and generate a structured analysis in JSON format. 

The XML will contain three types of tags:
- The "paths" tag will contain a list of all filenames in the Git repository.
- The "file" tag will have an attribute for that file's path and contain the file's contents.
- The "summary" tag will have an attribute for a file's or directory's path and contain the summary for that part created previously by you.

The output must strictly follow this schema:

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
`

export abstract class LangchainBaseInterface<
    Config extends { [property: string]: any },
> extends AiInterface<Config> {
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

    private async getResponse(systemMessage: string, userMessage: string): Promise<string> {
        console.log("getResponse", userMessage)
        const messages = [new SystemMessage(systemMessage), new HumanMessage(userMessage)]

        if (this.model === undefined) this.model = this.modelGen()

        const response = await this.model.invoke(messages)
        return response.content as string
    }

    private async summarizePart(path: string, content: string): Promise<string> {
        return `<summary path="${path}">${await this.getResponse(MESSAGE_SUMMARIZE_PARTS, content)}</summary>`
    }

    async analyze(repoSummary: RepositorySummary): Promise<AiResponse> {
        const contentsReachTokenLimit = (contents: string[]) =>
            countTokens(contents.join("\n")) >= this.getContextWindowSize()
        const groupedFiles = repoSummary.accumulateUntilLimit(contentsReachTokenLimit)
        console.log(groupedFiles)

        // TODO "paths" tag

        const mergedTopLevelsTree = await groupedFiles.mapAsync<
            never,
            { path: string; xml: string }
        >(
            async (directoryInfo, children) => {
                let mergedXml = ""
                for (let [child, _] of Object.values(children)) {
                    let fileContent = child.xml
                    if (contentsReachTokenLimit([fileContent])) {
                        fileContent = await this.summarizePart(child.path, fileContent)
                    }
                    mergedXml += fileContent
                }
                const summary = await this.summarizePart(directoryInfo.path, mergedXml)
                return [{ path: directoryInfo.path, xml: summary }, null]
            },
            async (fileInfo) => [
                {
                    path: fileInfo.path,
                    xml: fileInfo.mergedChildren
                        .map(([path, content]) => `<file path=${path}>${content}</file>`)
                        .join("\n"),
                },
                null,
            ],
        )
        const mergedTopLevels = Object.values(mergedTopLevelsTree.metaInfo).map((x) => x[0])
        console.log(mergedTopLevels)

        // TODO: summarize top levels between each other

        let responseContent = await this.getResponse(
            MESSAGE_ANALYZE_ENTIRE_REPO,
            mergedTopLevels.map(({ xml }) => xml).join("\n"),
        )

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
