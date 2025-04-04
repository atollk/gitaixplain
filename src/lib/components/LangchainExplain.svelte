<script lang="ts">
    import { AiInterface, type AiRepoSummary, type Graph } from "$lib/backend/ai_backend"
    import { countTokens } from "$lib/backend/util"
    import Loading from "$lib/components/util/Loading.svelte"
    import type { RepositoryDump } from "$lib/backend/repository_dump"
    import MermaidRender from "$lib/components/util/MermaidRender.svelte"
    import { flowGraphToMermaid } from "$lib/backend/mermaid_backend"
    import LangchainChat from "$lib/components/LangchainChat.svelte"
    import { analyzeRepo } from "$lib/backend/repository_summary"

    let props: {
        repoLink: string
        interface: AiInterface
        repoDump: RepositoryDump
    } = $props()

    const modelResponse = $derived<Promise<AiRepoSummary>>(
        analyzeRepo(props.interface, props.repoDump),
    )
    const renderGraph = (graph?: Graph) => (graph === undefined ? "" : flowGraphToMermaid(graph))
    const linkToFile = (filePath: string) => `${props.repoLink}/tree/HEAD/${filePath}`
    let chatElement: LangchainChat | undefined = $state()
</script>

{#await modelResponse}
    <Loading
        message="Summarizing the repository. This might take a while, depending on the size."
    />
    <p>{countTokens(props.repoDump.toXmlString())} tokens are being processed</p>
{:then modelResponse}
    <div class="flex max-w-[inherit] flex-col items-center justify-center">
        <div class="flex flex-col gap-3">
            <div>
                <h4 class="h4">Summary</h4>
                <p>
                    {modelResponse?.summary?.purpose}
                </p>
            </div>

            <div>
                <h4 class="h4">Main Flow</h4>
                <p>
                    {modelResponse?.summary?.mainFlow}
                </p>
            </div>
        </div>

        <div class="divider my-8"></div>

        <MermaidRender
            svgId="componentFlowMermaid"
            mermaidSpec={renderGraph(modelResponse?.componentFlowGraph)}
        />

        <div class="divider my-8"></div>

        <div>
            <div class="flex flex-col gap-3">
                <h4 class="h4">Key Files</h4>
                <ul class="list-disc">
                    {#each modelResponse?.keyFiles ?? [] as keyFile}
                        <li>
                            <a class="font-bold" href={linkToFile(keyFile?.path ?? "")}
                                >{keyFile.path}</a
                            >
                            <ul>
                                <li>Purpose: {keyFile.purpose}</li>
                                <li>Connections: {keyFile.connections}</li>
                                <li>Importance: {keyFile.importance} / 10</li>
                                <li>
                                    <button
                                        class="btn btn-sm btn-outline btn-info cursor-pointer"
                                        onclick={() => {
                                            chatElement?.suggestMessage(
                                                `Tell me more about the file "${keyFile.path}" and its role in the repository.`,
                                            )
                                        }}
                                    >
                                        Tell me more
                                    </button>
                                </li>
                            </ul>
                        </li>
                    {/each}
                </ul>
            </div>

            <div class="mt-10 mb-2">
                <h4 class="h4">External Dependencies</h4>
                <div class="flex flex-wrap gap-3">
                    {#each modelResponse?.dependencies ?? [] as dep}
                        <button
                            class="btn btn-sm btn-outline btn-info cursor-pointer"
                            onclick={() => {
                                chatElement?.suggestMessage(
                                    `Tell me more about the dependency "${dep}" and its role in the repository.`,
                                )
                            }}
                        >
                            {dep}
                        </button>
                    {/each}
                </div>
            </div>
        </div>

        <div class="divider my-8"></div>

        <div class="mb-10">
            <h6 class="h6">Chat about the repository</h6>
        </div>

        <LangchainChat
            bind:this={chatElement}
            aiInterface={props.interface}
            repositoryDump={props.repoDump}
        />

        <div class="mt-8 flex flex-col items-center gap-2">
            {#each modelResponse?.furtherQuestions ?? [] as q}
                <button
                    class="btn btn-outline btn-info cursor-pointer"
                    onclick={() => {
                        chatElement?.suggestMessage(q)
                    }}
                >
                    {q}
                </button>
            {/each}
        </div>
    </div>
{:catch error}
    <div role="alert" class="alert alert-error block">
        Error while loading the response.
        <p>{error}</p>
        <br />
        You can still attempt to chat with the model below.
    </div>

    <div class="divider my-8"></div>

    <div class="mb-10">
        <h6 class="h6">Chat about the repository</h6>
    </div>

    <LangchainChat
        bind:this={chatElement}
        aiInterface={props.interface}
        repositoryDump={props.repoDump}
    />
{/await}
