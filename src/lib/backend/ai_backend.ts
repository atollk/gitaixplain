import type { FormFields } from "$lib/components/util/ModelConfigForm.svelte"

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

export abstract class AiInterface<Config extends { [property: string]: any }> {
    protected constructor(public config: Config) {}

    abstract analyze(repoSummary: string): Promise<AiResponse>

    abstract getContextWindowSize(): number

    abstract getConfigFormFields(): FormFields<Config>
}
