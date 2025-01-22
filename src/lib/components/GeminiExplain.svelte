<script lang="ts">
    import { onMount } from "svelte"
    import Loading from "$lib/components/Loading.svelte"
    import { marked } from "marked"
    import { SvelteMap } from "svelte/reactivity"
    import { type AiResponse, Gemini, renderGraphviz } from "$lib/backend"

    let props: {
        apiKey: string
        repoSummary: XMLDocument
    } = $props()

    const model = new Gemini(props.apiKey)

    let modelResponse: AiResponse | undefined = $state()
    onMount(async () => {
        modelResponse = await model.analyze(props.repoSummary)
    })
    const keyFileInfos = $state(new SvelteMap<string, Promise<string>>())
</script>

{#if modelResponse === undefined}
    <Loading
        message="Summarizing the repository. This might take a while, depending on the size."
    />
{:else}
    <div class="flex max-w-[inherit] flex-col items-center justify-center">
        <p>{@html marked.parse(modelResponse.summary)}</p>

        <div class="divider my-8"></div>

        {#await renderGraphviz(modelResponse.flowGraph) then graph}
            {@html graph.outerHTML}
        {/await}

        <div class="divider my-8"></div>

        <ul class="list-disc">
            {#each modelResponse.keyFiles as keyFile}
                <li class="mb-3 list-item">
                    <p class="font-bold">{keyFile}</p>
                    {#if keyFileInfos.has(keyFile)}
                        {#await keyFileInfos.get(keyFile)}
                            <span class="loading loading-spinner loading-sm"></span>
                        {:then fileInfo}
                            <p>{@html marked.parse(fileInfo ?? "")}</p>
                        {/await}
                    {:else}
                        <button
                            onclick={() => keyFileInfos.set(keyFile, model.requestKeyFileInfo(keyFile, props.repoSummary))}
                        >
                            Tell me more
                        </button>
                    {/if}
                </li>
            {/each}
        </ul>

        <div class="divider my-8"></div>

        <p>{@html marked.parse(modelResponse.e2e)}</p>
    </div>
{/if}
