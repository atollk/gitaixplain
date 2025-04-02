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
        repoSummary: RepositoryDump
    } = $props()

    const modelResponse = $derived<Promise<AiRepoSummary>>(
        analyzeRepo(props.interface, props.repoSummary),
    )
    const renderGraph = (graph?: Graph) => (graph === undefined ? "" : flowGraphToMermaid(graph))
    const linkToFile = (filePath: string) => `${props.repoLink}/tree/HEAD/${filePath}`
</script>

{#await modelResponse}
    <Loading
        message="Summarizing the repository. This might take a while, depending on the size."
    />
    <p>{countTokens(props.repoSummary.toXmlString())} tokens are being processed</p>
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
                <h4 class="h4">Setup</h4>
                <ul class="list-disc">
                    {#each modelResponse?.usagePaths?.setup ?? [] as step}
                        <li>{step}</li>
                    {/each}
                </ul>
            </div>

            <div>
                <h4 class="h4">Main Flow</h4>
                <p>
                    {modelResponse?.usagePaths?.mainFlow}
                </p>
            </div>
        </div>

        <div class="divider my-8"></div>

        <MermaidRender
            svgId="componentFlowMermaid"
            mermaidSpec={renderGraph(modelResponse?.componentAnalysis?.flowGraph)}
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
                                <li>Importance: {keyFile.importance}</li>
                            </ul>
                        </li>
                    {/each}
                </ul>
            </div>

            <div>
                <h4 class="h4">External Dependencies</h4>
                {#each modelResponse?.dependencies ?? [] as dependency}
                    <p>{dependency}</p>
                {/each}
            </div>
        </div>

        <div class="divider my-8"></div>

        <div class="mb-10">
            <h6 class="h6">Chat about the repository</h6>
        </div>

        <LangchainChat aiInterface={props.interface} />
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

    <LangchainChat aiInterface={props.interface} />
{/await}
