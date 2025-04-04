import { FileTree, type RepositoryDump } from "$lib/backend/repository_dump"
import { AiChatInterface, AiInterface, type AiRepoSummary } from "$lib/backend/ai_backend"
import { approximateTokens, countTokens } from "$lib/backend/util"
import type { DocumentInterface } from "@langchain/core/documents"
import { CharacterTextSplitter } from "@langchain/textsplitters"
import { z } from "zod"
import { JsonOutputParser } from "@langchain/core/output_parsers"
import { zodToJsonSchema } from "zod-to-json-schema"

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

const STRUCTURE_ANALYZE_ENTIRE_REPO = z.object({
    summary: z.object({
        purpose: z.string().describe("The project's core purpose and design"),
        mainFlow: z.string().describe("Description of primary data/control flow through system"),
    }),
    componentFlowGraph: z
        .object({
            nodes: z
                .array(
                    z
                        .string()
                        .describe(
                            "Name of a single component. A component could be a class, a function, an abstract concept, or something else.",
                        ),
                )
                .max(20),
            edges: z.array(
                z.object({
                    from: z.string().describe("Component name with the outgoing connection"),
                    to: z.string().describe("Component name with the incoming connection"),
                    label: z.string().optional(),
                }),
            ),
        })
        .describe(
            'A "component analysis", which relates the different components used in this project in a flow graph, displaying their relation and functionality together.',
        ),
    keyFiles: z.array(
        z.object({
            path: z.string().describe("File path"),
            purpose: z
                .string()
                .describe(
                    "Brief description of file's role and why it is important to the repositories purpose",
                ),
            importance: z
                .number()
                .min(1)
                .max(10)
                .describe(
                    "From 1 to 10, how crucial this file is for understanding the repository purpose",
                ),
            connections: z
                .array(z.string())
                .describe("Other files in the repository related to this one"),
        }),
    ),
    dependencies: z
        .array(z.string())
        .describe("List of the most important dependencies frameworks / libraries")
        .max(10),
    furtherQuestions: z
        .array(
            z
                .string()
                .describe(
                    "A question that you would suggest me to ask you, to gain more detailed insight about the repository.",
                ),
        )
        .max(3),
})

const MESSAGE_ANALYZE_ENTIRE_REPO = `
Analyze the following Git repository XML data and generate a structured analysis in JSON format. 

The XML will contain three types of tags:
- The "paths" tag will contain a list of all filenames in the Git repository.
- The "file" tag will have an attribute for that file's path and contain the file's contents.
- The "summary" tag will have an attribute for a file's or directory's path and contain the summary for that part created previously by you.

The output must adhere to the following schema:

${JSON.stringify(zodToJsonSchema(STRUCTURE_ANALYZE_ENTIRE_REPO))}

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
            for (const child of Object.values(children)) {
                const fileInfo = child[0]
                let foundMatch = false
                for (let i = 0; i < childrenGroups.length; i++) {
                    const groupTokenSum = childrenGroups[i].reduce(
                        (acc, { tokens }) => acc + tokens,
                        0,
                    )
                    if (groupTokenSum + fileInfo.tokens < maxTokens) {
                        foundMatch = true
                        childrenGroups[i].push(fileInfo)
                    }
                }
                if (!foundMatch) childrenGroups.push([fileInfo])
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
): Promise<DocumentInterface[]> {
    const documents: DocumentInterface[] = []
    const textSplitter = new CharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
    for (const fileInfo of repositoryDump.fileContent.flatten()) {
        const split = await textSplitter.createDocuments(
            [`<file=${fileInfo.path}>\n${fileInfo.content}`],
            [{ path: fileInfo.path, fullContent: fileInfo.content }],
        )
        documents.push(...split)
    }
    return documents
}

export async function analyzeRepo(
    aiInterface: AiInterface,
    repositoryDump: RepositoryDump,
): Promise<AiRepoSummary> {
    const maxTokens =
        aiInterface.chatInterface.getContextWindowSize() - countTokens(MESSAGE_SUMMARIZE_PARTS)

    const mergedTopLevelsTree = await summarizeRepoToTopLevel(
        aiInterface.chatInterface,
        repositoryDump,
        maxTokens,
    )

    const mergedTopLevels = Object.values(mergedTopLevelsTree.metaInfo).map((x) => x[0])

    await aiInterface.embeddingInterface?.setDocuments(
        await extractVectorDocuments(repositoryDump),
    )

    // TODO: summarize top levels between each other

    const useWithStructure = false

    if (useWithStructure) {
        const responseContent = await aiInterface.chatInterface.getChatResponseWithStructure(
            MESSAGE_ANALYZE_ENTIRE_REPO,
            [
                {
                    text: mergedTopLevels.map(({ xml }) => xml).join("\n"),
                    byUser: true,
                },
            ],
            STRUCTURE_ANALYZE_ENTIRE_REPO,
        )
        console.log("responseContent", responseContent)
        return responseContent
    } else {
        const responseContent = await aiInterface.chatInterface.getChatResponse(
            MESSAGE_ANALYZE_ENTIRE_REPO,
            [
                {
                    text: mergedTopLevels.map(({ xml }) => xml).join("\n"),
                    byUser: true,
                },
            ],
        )
        const parser = new JsonOutputParser<AiRepoSummary>()
        const response = await parser.parse(responseContent)
        console.log("responseContent", response)
        return response
    }
}
