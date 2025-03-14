<script lang="ts">
    import { page } from "$app/state"
    import Header from "$lib/components/Header.svelte"
    import { chatProviderList, type ChatProviderName } from "$lib/models"
    import LangchainExplain from "$lib/components/LangchainExplain.svelte"
    import Loading from "$lib/components/util/Loading.svelte"
    import { fetchRepoSummary } from "$lib/backend/repository_dump"
    import { AiInterface } from "$lib/backend/ai_backend"
    import ConfigForm from "$lib/components/ConfigForm.svelte"
    import { goto } from "$app/navigation"
    import Footer from "$lib/components/Footer.svelte"
    import {
        GeminiChatInterface,
        GroqChatInterface,
        OllamaChatInterface,
    } from "$lib/backend/langchain_chat_implementations"
    import {
        GeminiRAGInterface,
        LocalRAGInterface,
        OllamaRAGInterface,
    } from "$lib/backend/langchain_rag_implementations"

    const urlParams = $derived(page.url.searchParams)
    const apiName = $derived((urlParams.get("api") as ChatProviderName) ?? chatProviderList[0])
    const config = $derived(JSON.parse(urlParams.get("config") ?? "{}"))
    const gitUrl = $derived.by(() => {
        const url = urlParams.get("git")
        if (url === null) {
            goto("/")
            throw "No git URL specified"
        }
        return url
    })

    function aiInterfaceFromModelName(
        apiName: ChatProviderName,
        config: Record<string, unknown>,
    ): AiInterface {
        switch (apiName) {
            case "Gemini":
                return new AiInterface(
                    new GeminiChatInterface(config),
                    new GeminiRAGInterface(config),
                )
            case "Groq":
                return new AiInterface(new GroqChatInterface(config), new LocalRAGInterface({}))
            case "Ollama":
                return new AiInterface(
                    new OllamaChatInterface(config),
                    new OllamaRAGInterface(config),
                )
            default:
                throw Error(`API ${apiName} is invalid.`)
        }
    }

    const model = $derived(aiInterfaceFromModelName(apiName, config))

    let repoSummary = $derived(fetchRepoSummary(gitUrl))
</script>

<main class="container mx-auto flex max-w-6xl flex-col items-center px-4 py-8">
    <Header />
    <ConfigForm initialUrl={gitUrl} initialApiName={apiName} initialConfig={config} />

    <div class="divider my-8"></div>

    {#await repoSummary}
        <Loading message="Loading your repository" />
    {:then repoSummary}
        <LangchainExplain repoLink={gitUrl} interface={model} {repoSummary} />
    {/await}
</main>

<footer>
    <Footer />
</footer>
