<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import ConfigForm from "$lib/components/ConfigForm.svelte"
    import { type ModelName, modelsList } from "$lib/models.js"
    import { GeminiInterface, OllamaInterface } from "$lib/backend/langchain_implementations.js"

    let modelName = $state<ModelName>(modelsList[0])
    const model = $derived.by(() => {
        switch (modelName) {
            case "Gemini":
                return new GeminiInterface("")
            case "Ollama":
                return new OllamaInterface(50_000)
            default:
                throw Error(`Model name ${modelName} is invalid.`)
        }
    })
</script>

<main class="container mx-auto flex max-w-4xl flex-col items-center px-4 py-8">
    <Header />
    <ConfigForm initialUrl="" bind:modelName={modelName} model={model} />
</main>
