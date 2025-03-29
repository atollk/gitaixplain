import { Tiktoken } from "js-tiktoken/lite"
import o200k_base from "js-tiktoken/ranks/o200k_base"

export function stripBackticks(s: string, code: string): string {
    const regex = new RegExp(`^\\s*\`\`\`${code}(.+)\`\`\`\\s*$`, "s")
    return s.replace(regex, "$1")
}

export function countTokens(content: string): number {
    return new Tiktoken(o200k_base).encode(content).length
}

const approximateTokensRegex = /\p{Letter}{1,4}|\S/gu

export function approximateTokens(content: string): number {
    return content.match(approximateTokensRegex)?.length ?? 0
}
