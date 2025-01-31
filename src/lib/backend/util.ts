import { get_encoding, encoding_for_model } from "tiktoken"

export async function fetchRepoSummary(url: string): Promise<XMLDocument> {
    // return Promise.resolve(new DOMParser().parseFromString("<foo></foo>", "application/xml"))
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

export function stripBackticks(s: string, code: string): string {
    const regex = new RegExp(`^\\s*\`\`\`${code}(.+)\`\`\`\\s*$`, "s")
    return s.replace(regex, "$1")
}

export function countTokens(content: string): number {
    const encoder = get_encoding("o200k_base")
    try {
        return encoder.encode_ordinary(content).length
    } finally {
        encoder.free()
    }
}
