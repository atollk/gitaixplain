<script lang="ts">
    import { page } from "$app/state"
    import Header from "$lib/components/Header.svelte"
    import { apiList, type ApiName } from "$lib/models"
    import { onMount } from "svelte"
    import LangchainExplain from "$lib/components/LangchainExplain.svelte"
    import Loading from "$lib/components/util/Loading.svelte"
    import { fetchRepoSummary, type RepositoryDump } from "$lib/backend/repo_summary_backend"
    import { AiInterface } from "$lib/backend/ai_backend"
    import ConfigForm from "$lib/components/ConfigForm.svelte"
    import { GeminiInterface, GroqInterface, OllamaInterface } from "$lib/backend/langchain_implementations"

    const { owner, repo } = page.params
    const urlParams = page.url.searchParams
    const apiName = urlParams.get("api") as ApiName ?? apiList[0]
    const config = JSON.parse(urlParams.get("config") ?? "{}")

    function aiInterfaceFromModelName(
        apiName: ApiName,
        config: { [property: string]: any },
    ): AiInterface<any> {
        switch (apiName) {
            case "Gemini":
                return new GeminiInterface({
                    apiKey: config.apiKey ?? "",
                    model: config.model ?? GeminiInterface.models[0].name,
                })
            case "Groq":
                return new GroqInterface({
                    apiKey: config.apiKey ?? "",
                    model: config.model ?? GroqInterface.models[0].name,
                })
            case "Ollama":
                return new OllamaInterface({ contextWindowSize: config.contextWindowSize ?? 4000 })
            default:
                throw Error(`API ${apiName} is invalid.`)
        }
    }

    const model = aiInterfaceFromModelName(apiName, config)

    let repoLink = $derived(`https://github.com/${owner}/${repo}`)
    let repoSummary = $state<RepositoryDump>()

    async function getContent(): Promise<void> {
        repoSummary = await fetchRepoSummary(repoLink)
    }

    onMount(async () => await getContent())
</script>

<main class="container mx-auto flex max-w-6xl flex-col items-center px-4 py-8">
    <Header />
    <ConfigForm
        initialUrl={repoLink}
        initialApiName={apiName}
        initialConfig={config}
    />

    <div class="divider my-8"></div>

    {#if repoSummary === undefined}
        <Loading message="Loading your repository" />
    {:else}
        <LangchainExplain repoLink={repoLink} interface={model} {repoSummary} />
    {/if}
</main>
