<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import LangchainExplain from "$lib/components/LangchainExplain.svelte"
    import Loading from "$lib/components/util/Loading.svelte"
    import { fetchRepoSummary } from "$lib/backend/repository_dump"
    import Footer from "$lib/components/Footer.svelte"
    import { appStore } from "$lib/store.svelte"
    import { page } from "$app/state"
    import ConfigModal from "$lib/components/config/ConfigModal.svelte"

    const gitUrlQueryParam = page.url.searchParams.get("git")
    if (gitUrlQueryParam) appStore.gitUrl = gitUrlQueryParam

    let githubUrl = $state(appStore.gitUrl)
    let configModal: ConfigModal | undefined = $state()
    let modalResetKey = $state({})

    let repoSummary = $derived.by(() => {
        if (appStore.gitUrl) {
            return fetchRepoSummary(appStore.gitUrl)
        } else {
            return null
        }
    })

    async function handleSubmit(e: SubmitEvent): Promise<void> {
        e.preventDefault()
        const urlPattern = /^(?:https:\/\/)?github\.com\/([^/]+)\/([^/]+)/
        const match = githubUrl.match(urlPattern)
        if (!match) {
            // TODO: nicer error message
            alert("Please enter a valid GitHub repository URL")
            return
        }
        appStore.gitUrl = githubUrl
    }
</script>

<main class="container mx-auto flex max-w-6xl flex-col items-center px-4 py-8">
    <Header />

    <form onsubmit={(e) => handleSubmit(e)} class="flex max-w-2xl flex-col items-center gap-6">
        <div class="form-control w-lg">
            <input
                bind:value={githubUrl}
                placeholder="Enter GitHub repository URL"
                class="input input-bordered w-full"
                required
            />
        </div>

        <div class="flex gap-6">
            <button class="btn w-48" type="button" onclick={() => configModal?.showModal()}>
                Configure
            </button>

            <button type="submit" class="btn btn-primary w-48"> Explain </button>
        </div>
    </form>

    {#key modalResetKey}
        <ConfigModal bind:this={configModal} onclose={() => (modalResetKey = {})} />
    {/key}

    <div class="divider my-8"></div>

    {#if appStore.gitUrl === undefined || repoSummary === null || appStore.aiInterface === undefined}
        <div></div>
    {:else}
        {#await repoSummary}
            <Loading message="Loading your repository" />
        {:then repoSummary}
            <LangchainExplain
                repoLink={appStore.gitUrl}
                interface={appStore.aiInterface.fillImplicitly()}
                {repoSummary}
            />
        {/await}
    {/if}
</main>

<footer>
    <Footer />
</footer>
