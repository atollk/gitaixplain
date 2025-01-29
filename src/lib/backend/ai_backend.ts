export interface AiResponse {
    summary?: {
        purpose?: string
    }
    componentAnalysis?: {
        flowGraph?: string
        entryPoints?: string[]
    }
    keyFiles?: {
        path?: string
        purpose?: string
        importance?: string
        connections?: string[]
    }[]
    usagePaths?: {
        setup?: string[]
        mainFlow?: string
        commonPatterns?: string[]
    }
    securityConsiderations?: {
        entryPoints?: string[]
        dataFlow?: string[]
        dependencies?: string[]
    }
}

export abstract class AiInterface {
    abstract analyze(repoSummary: XMLDocument): Promise<AiResponse>

    abstract requestKeyFileInfo(keyFile: string, repoSummary: XMLDocument): Promise<string>

    protected xmlToString(xml: XMLDocument): string {
        return new XMLSerializer().serializeToString(xml)
    }
}
