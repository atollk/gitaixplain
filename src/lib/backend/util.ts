import { get_encoding } from "tiktoken"

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
