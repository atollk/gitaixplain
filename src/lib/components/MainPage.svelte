<script lang="ts">
    import { page } from "$app/state"
    import Header from "$lib/components/Header.svelte"
    import { type ModelName, modelsList } from "$lib/models"
    import { onMount } from "svelte"
    import LangchainExplain from "$lib/components/LangchainExplain.svelte"
    import Loading from "$lib/components/util/Loading.svelte"
    import { fetchRepoSummary, type RepositorySummary } from "$lib/backend/repo_summary_backend"
    import { AiInterface } from "$lib/backend/ai_backend"
    import ConfigForm from "$lib/components/ConfigForm.svelte"
    import { GeminiInterface, OllamaInterface } from "$lib/backend/langchain_implementations"

    const { owner, repo } = page.params
    const urlParams = page.url.searchParams
    const modelName = urlParams.get("model") as ModelName ?? modelsList[0]
    const config = JSON.parse(urlParams.get("modelConfig") ?? "{}")

    function aiInterfaceFromModelName(
        modelName: ModelName,
        config: { [property: string]: any },
    ): AiInterface<any> {
        switch (modelName) {
            case "Gemini":
                return new GeminiInterface({ apiKey: config.apiKey ?? "" })
            case "Ollama":
                return new OllamaInterface({ contextWindowSize: config.contextWindowSize ?? 4000 })
            default:
                throw Error(`Model name ${modelName} is invalid.`)
        }
    }

    const model = aiInterfaceFromModelName(modelName, config)

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
        initialModelName={modelName}
        initialConfig={config}
    />

    <div class="divider my-8"></div>

    {#if repoSummary === undefined}
        <Loading message="Loading your repository" />
    {:else}
        <LangchainExplain interface={model} {repoSummary} />
    {/if}
</main>
