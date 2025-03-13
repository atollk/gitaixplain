import { FileTree, type RepositoryDump } from "$lib/backend/repository_dump"
import { AiChatInterface, AiInterface, type AiRepoSummary } from "$lib/backend/ai_backend"
import { approximateTokens, countTokens, stripBackticks } from "$lib/backend/util"
import type { DocumentInterface } from "@langchain/core/documents"
import { CharacterTextSplitter } from "@langchain/textsplitters"

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

async function summarizePart(
    chatAi: AiChatInterface,
    path: string,
    content: string,
): Promise<string> {
    const summary = await chatAi.getChatResponse(MESSAGE_SUMMARIZE_PARTS, [
        {
            text: content,
            byUser: true,
        },
    ])
    return `<summary path="${path}">${summary}</summary>`
}

type SummarizedFileInfo = { path: string; xml: string; tokens: number }

async function summarizeRepoToTopLevel(
    chatAi: AiChatInterface,
    repositoryDump: RepositoryDump,
    maxTokens: number,
): Promise<FileTree<never, SummarizedFileInfo>> {
    return await repositoryDump.fileContent.mapAsync(
        async (directoryInfo, children) => {
            await new Promise((r) => setTimeout(r, 10))
            // Group as many children together as possible while staying within token limit.
            const childrenGroups: { path: string; xml: string; tokens: number }[][] = []
            for (const [child, _] of Object.values(children)) {
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
                for (const { xml } of group) groupXml += xml
                return groupXml
            })

            // If there is only a single group, no need to summarize here.
            if (mergedXmls.length === 1) {
                const xml = mergedXmls[0]
                return [
                    {
                        path: directoryInfo.path,
                        xml: xml,
                        tokens: approximateTokens(xml),
                    },
                    null,
                ]
            }

            // Summarize all the children groups individually.
            const summarizedGroups: string[] = []
            for (const xml of mergedXmls) {
                summarizedGroups.push(await summarizePart(chatAi, directoryInfo.path, xml))
            }

            let completeXml = ""
            for (const xml of summarizedGroups) completeXml += xml
            return [
                {
                    path: directoryInfo.path,
                    xml: completeXml,
                    tokens: approximateTokens(completeXml),
                },
                null,
            ]
        },
        async (fileInfo) => {
            await new Promise((r) => setTimeout(r, 10))
            const xml = `<file path=${fileInfo.path}>${fileInfo.content}</file>`
            return [{ path: fileInfo.path, xml, tokens: approximateTokens(xml) }, null]
        },
    )
}

async function extractVectorDocuments(
    repositoryDump: RepositoryDump,
    mergedTopLevels: SummarizedFileInfo[],
    maxTokens: number,
): Promise<DocumentInterface[]> {
    const completeXml = {
        path: "",
        xml: mergedTopLevels.map(({ xml }) => xml).join("\n"),
        tokens: mergedTopLevels.reduce((n, { tokens }) => n + tokens, 0),
    }

    let vectorStoreDocuments: DocumentInterface[]

    if (completeXml.tokens <= maxTokens) {
        vectorStoreDocuments = [
            { pageContent: completeXml.xml, metadata: { path: completeXml.path } },
        ]
    } else {
        const documents: DocumentInterface[] = []
        const textSplitter = new CharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 100 })
        await repositoryDump.fileContent.mapAsync(
            async (a, b) => [a, b],
            async (fileInfo) => {
                const split = await textSplitter.createDocuments(
                    [fileInfo.content],
                    [{ path: fileInfo.path }],
                )
                documents.push(...split)
                return [fileInfo, null]
            },
        )
        vectorStoreDocuments = documents
    }

    return vectorStoreDocuments
}

export async function analyzeRepo(
    aiInterface: AiInterface,
    repositoryDump: RepositoryDump,
): Promise<AiRepoSummary> {
    // TODO: exclude binary files
    const maxTokens =
        aiInterface.chatAi.getContextWindowSize() - countTokens(MESSAGE_SUMMARIZE_PARTS)

    // TODO "paths" tag

    const mergedTopLevelsTree = await summarizeRepoToTopLevel(
        aiInterface.chatAi,
        repositoryDump,
        maxTokens,
    )

    const mergedTopLevels = Object.values(mergedTopLevelsTree.metaInfo).map((x) => x[0])

    await aiInterface.ragAi.setDocuments(
        await extractVectorDocuments(repositoryDump, mergedTopLevels, maxTokens),
    )

    // TODO: summarize top levels between each other

    let responseContent = await aiInterface.chatAi.getChatResponse(MESSAGE_ANALYZE_ENTIRE_REPO, [
        {
            text: mergedTopLevels.map(({ xml }) => xml).join("\n"),
            byUser: true,
        },
    ])

    responseContent = stripBackticks(responseContent, "json")
    console.log("responseContent", responseContent)
    return JSON.parse(responseContent)
}
