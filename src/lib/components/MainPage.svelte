<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import LangchainExplain from "$lib/components/LangchainExplain.svelte"
    import Loading from "$lib/components/util/Loading.svelte"
    import { fetchRepoSummary } from "$lib/backend/repository_dump"
    import ConfigForm from "$lib/components/ConfigForm.svelte"
    import Footer from "$lib/components/Footer.svelte"
    import { store } from "$lib/store.svelte"
    import { AiInterface } from "$lib/backend/ai_backend"

    let repoSummary = $derived.by(() => {
        if (store.gitUrl) {
            return fetchRepoSummary(store.gitUrl)
        } else {
            return null
        }
    })
    let aiInterface = $derived.by(() => {
        if (store.chatInterface && store.ragInterface) {
            return new AiInterface(store.chatInterface, store.ragInterface)
        } else {
            return null
        }
    })
</script>

<main class="container mx-auto flex max-w-6xl flex-col items-center px-4 py-8">
    <Header />
    <ConfigForm />

    <div class="divider my-8"></div>

    {#if store.gitUrl === undefined || repoSummary === null || aiInterface === null}
        TODO
    {:else}
        {#await repoSummary}
            <Loading message="Loading your repository" />
        {:then repoSummary}
            <LangchainExplain repoLink={store.gitUrl} interface={aiInterface} {repoSummary} />
        {/await}
    {/if}
</main>

<footer>
    <Footer />
</footer>
