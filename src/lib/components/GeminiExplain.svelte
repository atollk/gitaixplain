<script lang="ts">
    import Loading from "$lib/components/Loading.svelte"
    import { type AiResponse, Gemini, initMermaid } from "$lib/backend"
    import MermaidRender from "$lib/components/MermaidRender.svelte"

    let props: {
        apiKey: string
        repoSummary: XMLDocument
    } = $props()

    const model = new Gemini(props.apiKey)
    const modelResponse: Promise<AiResponse> = $state(model.analyze(props.repoSummary))
</script>

{#await modelResponse}
    <Loading
        message="Summarizing the repository. This might take a while, depending on the size."
    />
{:then modelResponse}
    <div class="flex max-w-[inherit] flex-col items-center justify-center">
        {modelResponse?.summary?.purpose}

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
