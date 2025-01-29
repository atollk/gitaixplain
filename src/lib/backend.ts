import { instance } from "@viz-js/viz"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import Aixplanation from "$lib/components/Aixplanation.svelte"
import { default as Color } from "colorjs.io"
import mermaid from "mermaid"

export async function fetchRepoSummary(url: string): Promise<XMLDocument> {
    return Promise.resolve(new DOMParser().parseFromString("<foo></foo>", "application/xml"))
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

function stripBackticks(s: string, code: string): string {
    const regex = new RegExp(`^\\s*\`\`\`${code}(.+)\`\`\`\\s*$`, "s")
    return s.replace(regex, "$1")
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
            new HumanMessage(this.xmlToString(repoSummary)),
        ]

        //const response = await this.model.invoke(messages)
        //let responseContent = response.content as string
        //responseContent = stripBackticks(responseContent, "json")
        const responseContent = `{
  "summary": {
    "purpose": "Gitingest provides a command-line interface and Python package for generating text digests of Git repositories, suitable for use with large language models (LLMs).  It extracts code and documentation, providing a structured summary and file content for efficient LLM processing.",
    "techStack": [
      "Python",
      "FastAPI",
      "Jinja2",
      "Tailwind CSS",
      "JavaScript",
      "Git",
      "Docker",
      "pytest"
    ],
    "architectureStyle": "Monolith"
  },
  "componentAnalysis": {
    "flowGraph": "\`\`\`mermaid\\ngraph LR\\n    A[User Input] --> B(parse_query); \\n    B --> C{Repository Type?};\\n    C -- Local --> D(scan_directory); \\n    C -- Remote --> E(clone_repo); \\n    E --> D; \\n    D --> F(extract_files_content); \\n    F --> G(create_file_content_string); \\n    G --> H(generate_response); \\n    H --> I[User Output];\\n\`\`\`",
    "entryPoints": [
      "src/main.py",
      "src/gitingest/cli.py"
    ]
  },
  "keyFiles": [
    {
      "path": "src/main.py",
      "purpose": "FastAPI application entry point",
      "importance": "Starts the web server and routes requests",
      "connections": [
        "src/config.py",
        "src/routers/__init__.py",
        "src/server_utils.py",
        "src/utils.py"
      ]
    },
    {
      "path": "src/gitingest/query_ingestion.py",
      "purpose": "Core logic for repository analysis",
      "importance": "Handles directory traversal, file reading, and content extraction",
      "connections": [
        "src/gitingest/query_parser.py",
        "src/gitingest/repository_clone.py",
        "src/gitingest/notebook_utils.py"
      ]
    },
    {
      "path": "src/gitingest/query_parser.py",
      "purpose": "Parses user input and validates repository URLs",
      "importance": "Extracts relevant information from URLs and paths",
      "connections": [
        "src/gitingest/repository_clone.py",
        "src/config.py"
      ]
    },
    {
      "path": "src/gitingest/repository_clone.py",
      "purpose": "Clones Git repositories",
      "importance": "Handles Git interactions for remote repositories",
      "connections": [
        "src/gitingest/query_parser.py"
      ]
    },
    {
      "path": "src/routers/__init__.py",
      "purpose": "FastAPI router definitions",
      "importance": "Organizes the API endpoints",
      "connections": [
        "src/routers/download.py",
        "src/routers/dynamic.py",
        "src/routers/index.py"
      ]
    },
    {
      "path": "src/templates/base.jinja",
      "purpose": "Base HTML template",
      "importance": "Provides the basic structure for all HTML pages",
      "connections": [
        "src/templates/index.jinja",
        "src/templates/git.jinja",
        "src/templates/api.jinja"
      ]
    }
  ],
  "usagePaths": {
    "setup": [
      "1. Install Python 3.10 or higher.",
      "2. \`pip install gitingest\`",
      "3. Run from command line: \`gitingest <path_to_repo>\` or \`gitingest <repo_url>\`"
    ],
    "mainFlow": "1. User provides a Git repository URL or local path. 2. The URL is parsed to extract relevant information. 3. If the source is a remote repository, it is cloned. 4. The repository is scanned, and files are processed according to specified patterns. 5. A summary and file content are generated and returned to the user.",
    "commonPatterns": [
      "Use of AsyncIO for asynchronous operations",
      "Extensive use of dataclasses for data structuring",
      "Modular design with separate modules for different functionalities"
    ]
  },
  "securityConsiderations": {
    "entryPoints": [
      "/download/{digest_id}",
      "/{full_path:path}"
    ],
    "dataFlow": [
      "No sensitive data paths identified"
    ],
    "dependencies": [
      "fastapi-analytics",
      "slowapi"
    ]
  }
}`
        const parsedResponse: AiResponse = JSON.parse(responseContent)
        if (parsedResponse.componentAnalysis !== undefined) {
            parsedResponse.componentAnalysis.flowGraph = stripBackticks(
                parsedResponse?.componentAnalysis?.flowGraph ?? "",
                "mermaid",
            )
        }

        return parsedResponse
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

export function initMermaid() {
    const themeColors = extractThemeColorsFromDOM()
    const colorToHex = (colorString: string) => {
        const c = new Color(colorString)
        return c.to("srgb").toString({ format: "hex" })
    }
    mermaid.initialize({
        theme: "base",
        themeVariables: {
            primaryColor: colorToHex(themeColors.primary),
            primaryTextColor: colorToHex(themeColors.primaryContent),
            secondaryColor: colorToHex(themeColors.secondary),
            secondaryTextColor: colorToHex(themeColors.secondaryContent),
            tertiaryColor: colorToHex(themeColors.accent),
            tertiaryTextColor: colorToHex(themeColors.accentContent),
            background: colorToHex(themeColors.base100),
        },
        fontSize: 100,
    })
}

interface ThemeColors {
    primary: string
    primaryFocus: string
    primaryContent: string
    secondary: string
    secondaryFocus: string
    secondaryContent: string
    accent: string
    accentFocus: string
    accentContent: string
    neutral: string
    neutralFocus: string
    neutralContent: string
    base100: string
    base200: string
    base300: string
    baseContent: string
    info: string
    infoContent: string
    success: string
    successContent: string
    warning: string
    warningContent: string
    error: string
    errorContent: string
}

function extractThemeColorsFromDOM(): ThemeColors {
    const computedStyles = getComputedStyle(document.querySelector(":root")!)
    return {
        primary: `oklch(${computedStyles.getPropertyValue("--p")})`,
        primaryFocus: `oklch(${computedStyles.getPropertyValue("--pf")})`,
        primaryContent: `oklch(${computedStyles.getPropertyValue("--pc")})`,
        secondary: `oklch(${computedStyles.getPropertyValue("--s")})`,
        secondaryFocus: `oklch(${computedStyles.getPropertyValue("--sf")})`,
        secondaryContent: `oklch(${computedStyles.getPropertyValue("--sc")})`,
        accent: `oklch(${computedStyles.getPropertyValue("--a")})`,
        accentFocus: `oklch(${computedStyles.getPropertyValue("--af")})`,
        accentContent: `oklch(${computedStyles.getPropertyValue("--ac")})`,
        neutral: `oklch(${computedStyles.getPropertyValue("--n")})`,
        neutralFocus: `oklch(${computedStyles.getPropertyValue("--nf")})`,
        neutralContent: `oklch(${computedStyles.getPropertyValue("--nc")})`,
        base100: `oklch(${computedStyles.getPropertyValue("--b1")})`,
        base200: `oklch(${computedStyles.getPropertyValue("--b2")})`,
        base300: `oklch(${computedStyles.getPropertyValue("--b3")})`,
        baseContent: `oklch(${computedStyles.getPropertyValue("--bc")})`,
        info: `oklch(${computedStyles.getPropertyValue("--in")})`,
        infoContent: `oklch(${computedStyles.getPropertyValue("--inc")})`,
        success: `oklch(${computedStyles.getPropertyValue("--su")})`,
        successContent: `oklch(${computedStyles.getPropertyValue("--suc")})`,
        warning: `oklch(${computedStyles.getPropertyValue("--wa")})`,
        warningContent: `oklch(${computedStyles.getPropertyValue("--wac")})`,
        error: `oklch(${computedStyles.getPropertyValue("--er")})`,
        errorContent: `oklch(${computedStyles.getPropertyValue("--erc")})`,
    }
}
