<script lang="ts">
    import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
    import { HumanMessage, SystemMessage } from "@langchain/core/messages"
    import { onMount } from "svelte"
    import { instance } from "@viz-js/viz"
    import Loading from "$lib/components/Loading.svelte"
    import { marked } from "marked"
    import { SvelteMap } from "svelte/reactivity"
    import { renderGraphviz } from "$lib/backend"

    let props: {
        apiKey: string
        repoSummary: string
    } = $props()

    interface ModelResponse {
        summary: string
        flowGraph: string
        keyFiles: string[]
        e2e: string
    }

    const model = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash",
        temperature: 0,
        apiKey: props.apiKey,
    })

    async function callGemini(): Promise<ModelResponse> {
        const messages = [
            new SystemMessage(
                `
You will be provided with the complete contents of a Git repository in XML format.
Your task is to analyze and summarize that data. Provide the result in JSON format (without backticks to mark it as such) with the fields listed below.
 - "summary": Contains a Markdown paragraph of the general purpose and tech stack of the project.
 - "flowGraph": Contains Graphviz code that, when rendered, displays a visual flow graph of relevant information to understand the repository.
 - "keyFiles": A JSON array of the 10 most important files of the repository.
 - "e2e": An Markdown-formatted exemplar end-to-end use case of the project with information about how data flows through the different components.
				`,
            ),
            new HumanMessage(props.repoSummary),
        ]

        const response = await model.invoke(messages)
        return JSON.parse(response.content as string)
    }

    async function requestKeyFileInfo(keyFile: string): Promise<string> {
        const messages = [
            new SystemMessage(
                `
You will be provided with the complete contents of a Git repository in XML format.
One of the most important files is ${keyFile}. Tell me why it is important and some info about its content.
				`,
            ),
            new HumanMessage(props.repoSummary),
        ]

        const response = await model.invoke(messages)
        return response.content as string
    }

    let modelResponse: ModelResponse | undefined = $state()
    onMount(async () => {
        modelResponse = await callGemini()
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
                            onclick={() => keyFileInfos.set(keyFile, requestKeyFileInfo(keyFile))}
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
