import { instance } from "@viz-js/viz"

export async function fetchRepoSummary(url: string): Promise<string> {
    const apiUrl = "https://api.repomix.com/api/pack"
    const requestBody = JSON.stringify({
        format: "xml",
        options: {
            directoryStructure: true,
            fileSummary: true,
            removeComments: false,
            removeEmptyLines: false,
            showLineNumbers: false,
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
    return responseBody.content
}

export async function renderGraphviz(code: string | undefined): Promise<SVGElement> {
    if (code === undefined) return new Promise(() => {})
    else return (await instance()).renderSVGElement(code)
}
