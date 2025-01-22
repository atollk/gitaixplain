import { instance } from "@viz-js/viz"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import Aixplanation from "$lib/components/Aixplanation.svelte"

export async function fetchRepoSummary(url: string): Promise<XMLDocument> {
    const apiUrl = "https://api.repomix.com/api/pack"
    const requestBody = JSON.stringify({
        format: "xml",
        options: {
            directoryStructure: true,
            fileSummary: true,
            removeComments: false,
            removeEmptyLines: false,
            showLineNumbers: false,
            outputParsable: true,
        },
        signal: {},
        url: url,
    })
    const response = await fetch(apiUrl, {
        method: "POST",
        body: requestBody,
    })
    const responseBody = await response.json()
    if (!response.ok) {
        throw new Error(`Response status: ${response.status} ${JSON.stringify(responseBody)}`)
    }
    return new DOMParser().parseFromString(responseBody.content, "application/xml")
}

export async function renderGraphviz(code: string | undefined): Promise<SVGElement> {
    if (code === undefined) return new Promise(() => {})
    else return (await instance()).renderSVGElement(code)
}

export interface AiResponse {
    summary: string
    flowGraph: string
    keyFiles: string[]
    e2e: string
}

export abstract class AiInterface {
    abstract analyze(repoSummary: XMLDocument): Promise<AiResponse>

    abstract requestKeyFileInfo(keyFile: string, repoSummary: XMLDocument): Promise<string>

    protected xmlToString(xml: XMLDocument): string {
        return new XMLSerializer().serializeToString(xml)
    }
}

export class Gemini extends AiInterface {
    private readonly apiKey: string
    private readonly model: any

    constructor(apiKey: string) {
        super()
        this.apiKey = apiKey
        this.model = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            temperature: 0,
            apiKey: this.apiKey,
        })
    }

    async analyze(repoSummary: XMLDocument): Promise<AiResponse> {
        const messages = [
            new SystemMessage(
                `
You will be provided with the complete contents of a Git repository in XML format.
Your task is to analyze and summarize that data. Provide the result in JSON format with the fields listed below.
 - "summary": Contains a Markdown paragraph of the general purpose and tech stack of the project.
 - "flowGraph": Contains Graphviz code that, when rendered, displays a visual flow graph of relevant information to understand the repository.
 - "keyFiles": A JSON array of the 10 most important files of the repository.
 - "e2e": An Markdown-formatted exemplar end-to-end use case of the project with information about how data flows through the different components.
				`,
            ),
            new HumanMessage(this.xmlToString(repoSummary)),
        ]

        const response = await this.model.invoke(messages)
        let responseContent = response.content as string
        responseContent = responseContent.replace(/^\s*```json(.+)```\s*$/s, "$1")
        return JSON.parse(responseContent)
    }

    async requestKeyFileInfo(keyFile: string, repoSummary: XMLDocument): Promise<string> {
        const messages = [
            new SystemMessage(
                `
You will be provided with the complete contents of a Git repository in XML format.
One of the most important files is ${keyFile}. Tell me why it is important and some info about its content.
				`,
            ),
            new HumanMessage(this.xmlToString(repoSummary)),
        ]

        const response = await this.model.invoke(messages)
        return response.content as string
    }
}
