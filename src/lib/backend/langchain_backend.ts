import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { countTokens, stripBackticks } from "$lib/backend/util"
import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import type { RepositorySummary } from "$lib/backend/repo_summary_backend"
import { AiInterface, type AiResponse } from "$lib/backend/ai_backend"

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

Provide your output in a formal and factual tone in form of a document to be read.
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
    "flowGraph": {  // A graph describing components and their interactions.
        "nodes": ["Node Name1", "Node Name2", ...],
        "edges": [
          {
            "from": "string",  // node name
            "to": "string",    // node name
            "label": "string", // optional
          }
        ]
    },
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
  },
  "dependencies": ["List of important dependencies frameworks / libraries"]
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

    protected abstract get supportsSystemPrompt(): boolean

    private async summarizePart(path: string, content: string): Promise<string> {
        const summary = await this.getChatResponse(MESSAGE_SUMMARIZE_PARTS, [
            {
                text: content,
                byUser: true,
            },
        ])
        return `<summary path="${path}">${summary}</summary>`
    }

    async getChatResponse(
        systemMessage: string,
        chat: { text: string; byUser: boolean }[],
    ): Promise<string> {
        if (this.model === undefined) this.model = this.modelGen()

        const messages = [
            this.supportsSystemPrompt
                ? new SystemMessage(systemMessage)
                : new HumanMessage(systemMessage),
        ]
        for (let { text, byUser } of chat) {
            messages.push(byUser ? new HumanMessage(text) : new AIMessage(text))
        }

        console.log("getChatResponse", messages)
        const response = await this.model.invoke(messages)
        return response.content as string
    }

    async analyzeRepo(repoSummary: RepositorySummary): Promise<AiResponse> {
        const maxTokens = this.getContextWindowSize() - countTokens(MESSAGE_SUMMARIZE_PARTS)

        // TODO "paths" tag

        const mergedTopLevelsTree = await repoSummary.fileContent.mapAsync<
            never,
            { path: string; xml: string; tokens: number }
        >(
            async (directoryInfo, children) => {
                await new Promise((r) => setTimeout(r, 10))
                // Group as many children together as possible while staying within token limit.
                const childrenGroups: { path: string; xml: string; tokens: number }[][] = []
                for (let [child, _] of Object.values(children)) {
                    let foundMatch = false
                    for (let i = 0; i < childrenGroups.length; i++) {
                        const groupTokenSum = childrenGroups[i].reduce(
                            (acc, { tokens }) => acc + tokens,
                            0,
                        )
                        if (groupTokenSum + child.tokens < maxTokens) {
                            foundMatch = true
                            childrenGroups[i].push(child)
                        }
                    }
                    if (!foundMatch) childrenGroups.push([child])
                }

                // Merge the XML of all groups.
                const mergedXmls = childrenGroups.map((group) => {
                    let groupXml = ""
                    for (let { xml } of group) groupXml += xml
                    return groupXml
                })

                // If there is only a single group, no need to summarize here.
                if (mergedXmls.length === 1)
                    return [
                        {
                            path: directoryInfo.path,
                            xml: mergedXmls[0],
                            tokens: countTokens(mergedXmls[0]),
                        },
                        null,
                    ]

                // Summarize all the children groups individually.
                let summarizedGroups: string[] = []
                for (let xml of mergedXmls) {
                    summarizedGroups.push(await this.summarizePart(directoryInfo.path, xml))
                }

                let completeXml = ""
                for (let xml of summarizedGroups) completeXml += xml
                return [
                    {
                        path: directoryInfo.path,
                        xml: completeXml,
                        tokens: countTokens(completeXml),
                    },
                    null,
                ]
            },
            async (fileInfo) => {
                await new Promise((r) => setTimeout(r, 10))
                const xml = `<file path=${fileInfo.path}>${fileInfo.content}</file>`
                return [{ path: fileInfo.path, xml, tokens: countTokens(xml) }, null]
            },
        )
        const mergedTopLevels = Object.values(mergedTopLevelsTree.metaInfo).map((x) => x[0])

        // TODO: summarize top levels between each other

        let responseContent = await this.getChatResponse(MESSAGE_ANALYZE_ENTIRE_REPO, [
            {
                text: mergedTopLevels.map(({ xml }) => xml).join("\n"),
                byUser: true,
            },
        ])

        responseContent = stripBackticks(responseContent, "json")
        const parsedResponse: AiResponse = JSON.parse(responseContent)
        console.log(parsedResponse)
        return parsedResponse
    }
}
