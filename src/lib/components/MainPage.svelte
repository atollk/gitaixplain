<script lang="ts">
    import { page } from "$app/state"
    import Header from "$lib/components/Header.svelte"
    import ConfigForm from "$lib/components/ConfigForm.svelte"
    import { type ModelName, modelsList } from "$lib/models"
    import { onMount } from "svelte"
    import LangchainExplain from "$lib/components/LangchainExplain.svelte"
    import Loading from "$lib/components/util/Loading.svelte"
    import { GeminiInterface, OllamaInterface } from "$lib/backend/langchain_implementations.js"
    import { fetchRepoSummary, type RepositorySummary } from "$lib/backend/repo_summary_backend"

    const { owner, repo } = page.params
    const urlParams = page.url.searchParams
    let modelName = $state(urlParams.get("model") as ModelName ?? modelsList[0])
    const model = $derived.by(() => {
        switch (modelName) {
            case "Gemini":
                const apiKey = urlParams.get("apiKey") ?? ""
                return new GeminiInterface(apiKey)
            case "Ollama":
                return new OllamaInterface(50_000)
            default:
                throw Error(`Model name ${modelName} is invalid.`)
        }
    })
    $inspect(modelName, model)

    let repoSummary = $state<RepositorySummary>()

    async function getContent(): Promise<void> {
        repoSummary = await fetchRepoSummary(`https://github.com/${owner}/${repo}`)
    }

    onMount(async () => await getContent())
</script>

<main class="container mx-auto flex max-w-6xl flex-col items-center px-4 py-8">
    <Header />
    <ConfigForm
        initialUrl={`https://github.com/${owner}/${repo}`}
        bind:modelName={modelName}
        model={model}
    />

    <div class="divider my-8"></div>

    {#if repoSummary === undefined}
        <Loading message="Loading your repository" />
    {:else}
        <LangchainExplain interface={model} {repoSummary} />
    {/if}
</main>
