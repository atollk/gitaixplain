import { get_encoding } from "tiktoken"
import { default as LightningFS } from "@isomorphic-git/lightning-fs"

export function stripBackticks(s: string, code: string): string {
    const regex = new RegExp(`^\\s*\`\`\`${code}(.+)\`\`\`\\s*$`, "s")
    return s.replace(regex, "$1")
}

class TokenCounter {
    // TODO
    // from https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py
    init() {}

    private loadTiktokenFile(): string {
        // @ts-ignore
        const fsOptions: LightningFS.Options = { wipe: true }
        const fs = new LightningFS("fs", fsOptions)

        const downloadUri =
            "https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken"
        const downloadHash = "446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d"
    }
}

export function countTokens(content: string): number {
    const encoder = get_encoding("o200k_base")
    try {
        return encoder.encode_ordinary(content).length
    } finally {
        encoder.free()
    }
}
