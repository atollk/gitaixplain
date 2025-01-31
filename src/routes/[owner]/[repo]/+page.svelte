<script lang="ts">
    import { page } from "$app/state"
    import Header from "$lib/components/Header.svelte"
    import GitForm from "$lib/components/GitForm.svelte"
    import { modelsList } from "$lib/models"
    import { onMount } from "svelte"
    import Loading from "$lib/components/Loading.svelte"
    import LangchainExplain from "$lib/components/LangchainExplain.svelte"
    import { fetchRepoSummary } from "$lib/backend/util"
    import { geminiInterface, ollamaInterface } from "$lib/backend/langchain_implementations"

    const { owner, repo } = page.params
    const urlParams = page.url.searchParams
    const model = urlParams.get("model") ?? modelsList[0]
    const apiKey = urlParams.get("apiKey") ?? ""

    let repoSummary = $state<XMLDocument>()

    async function getContent(): Promise<void> {
        repoSummary = await fetchRepoSummary(`https://github.com/${owner}/${repo}`)
    }

    onMount(async () => await getContent())
</script>

<main class="container mx-auto flex max-w-6xl flex-col items-center px-4 py-8">
    <Header />
    <GitForm
        initialUrl={`https://github.com/${owner}/${repo}`}
        initialModel={model}
        initialApiKey={apiKey}
    />

    <div class="divider my-8"></div>

    {#if repoSummary === undefined}
        <Loading message="Loading your repository" />
    {:else if model === "Gemini"}
        <LangchainExplain interface={geminiInterface(apiKey)} {repoSummary} />
    {:else if model === "Ollama"}
        <LangchainExplain interface={ollamaInterface()} {repoSummary} />
    {:else}
        Error: Model {model} not found.
    {/if}
</main>
