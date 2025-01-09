<script lang="ts">
    import { fetchRepoSummary } from "$lib/backend"
    import type { Model } from "$lib/models"
    import GeminiExplain from "$lib/components/GeminiExplain.svelte"
    import Loading from "$lib/components/Loading.svelte"

    interface Props {
        owner: string
        repo: string
        model: Model
        apiKey: string
    }

    const props: Props = $props()
    let repoSummary = $state("")

    async function getContent(): Promise<void> {
        repoSummary = await fetchRepoSummary(`https://github.com/${props.owner}/${props.repo}`)
    }

    getContent()
</script>

{#if repoSummary === ""}
    <Loading message="Loading your repository" />
{:else}
    <GeminiExplain apiKey={props.apiKey} {repoSummary} />
{/if}
