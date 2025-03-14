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

export function convertToConfig<T>(
    input: Record<string, unknown>,
    defaults: {
        [K in keyof T]: T[K]
    },
): T {
    const result = { ...defaults }

    for (const key in defaults) {
        if (key in input) {
            const inputValue = input[key]
            const defaultValue = defaults[key]

            // Check if the types match
            if (
                typeof inputValue === typeof defaultValue ||
                (Array.isArray(inputValue) && Array.isArray(defaultValue)) ||
                (inputValue === null && defaultValue === null) ||
                (inputValue instanceof Date && defaultValue instanceof Date)
            ) {
                ;(result as any)[key] = inputValue
            }
        }
    }

    return result
}
