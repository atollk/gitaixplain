<script lang="ts">
    import Loading from "$lib/components/Loading.svelte"
    import MermaidRender from "$lib/components/MermaidRender.svelte"
    import type { AiResponse } from "$lib/backend/ai_backend"
    import type { LangchainBaseInterface } from "$lib/backend/langchain_backend"
    import { countTokens } from "$lib/backend/util"

    let props: {
        interface: LangchainBaseInterface<unknown>,
        repoSummary: XMLDocument,
    } = $props()

    const modelResponse = $state<Promise<AiResponse>>(props.interface.analyze(props.repoSummary))
</script>

{#await modelResponse}
    <Loading
        message="Summarizing the repository. This might take a while, depending on the size."
    />
    <p>{countTokens(new XMLSerializer().serializeToString(props.repoSummary))}</p>
{:then modelResponse}
    <div class="flex max-w-[inherit] flex-col items-center justify-center">
        <p>
            {modelResponse?.summary?.purpose}
        </p>

        <div class="divider my-8"></div>

        <MermaidRender svgId="componentFlowMermaid" mermaidSpec={modelResponse?.componentAnalysis?.flowGraph ?? ""} />

        <div class="divider my-8"></div>

        <ul class="list-disc">
        </ul>

        <div class="divider my-8"></div>
    </div>
{:catch error}
    <div role="alert" class="alert alert-error block">
        Error while loading the response.
        <p>{error}</p>
    </div>
{/await}
