<script context="module" lang="ts">
    import type { Snippet } from "svelte"
    import type { ModelName } from "$lib/models"

    export type ConfigSnippet<T> = Snippet<[T, (config: T) => void]>

    export function getSnippetFromModelName(modelName: ModelName): ConfigSnippet<any> {
        switch (modelName) {
            case "Gemini":
                return geminiConfigSnippet
            case "Ollama":
                return ollamaConfigSnippet
            default:
                throw Error(`Model name ${modelName} is invalid.`)
        }
    }
</script>

{#snippet geminiConfigSnippet(initialConfig: {apiKey: string}, onInput: (config: {apiKey: string}) => void)}
    <div>hi</div>
{/snippet}

{#snippet ollamaConfigSnippet(initialConfig: {contextWindowSize: number}, onInput: (config: {contextWindowSize: number}) => void)}
    <div>hi ollama</div>
{/snippet}