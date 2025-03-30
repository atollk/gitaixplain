<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import LangchainExplain from "$lib/components/LangchainExplain.svelte"
    import Loading from "$lib/components/util/Loading.svelte"
    import { fetchRepoSummary } from "$lib/backend/repository_dump"
    import Footer from "$lib/components/Footer.svelte"
    import { store } from "$lib/store.svelte"
    import ConfigForm from "$lib/components/config/ConfigForm.svelte"

    let repoSummary = $derived.by(() => {
        if (store.gitUrl) {
            return fetchRepoSummary(store.gitUrl)
        } else {
            return null
        }
    })
</script>

<main class="container mx-auto flex max-w-6xl flex-col items-center px-4 py-8">
    <Header />
    <ConfigForm />

    <div class="divider my-8"></div>

    {#if store.gitUrl === undefined || repoSummary === null || store.aiInterface === undefined}
        <div></div>
    {:else}
        {#await repoSummary}
            <Loading message="Loading your repository" />
        {:then repoSummary}
            <LangchainExplain repoLink={store.gitUrl} interface={store.aiInterface} {repoSummary} />
        {/await}
    {/if}
</main>

<footer>
    <Footer />
</footer>
