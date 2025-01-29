<script lang="ts">
    import Loading from "$lib/components/Loading.svelte"
    import MermaidRender from "$lib/components/MermaidRender.svelte"
    import { Gemini } from "$lib/backend/langchain_backend"
    import type { AiResponse } from "$lib/backend/ai_backend"

    let props: {
        apiKey: string
        repoSummary: XMLDocument
    } = $props()

    const model = new Gemini(props.apiKey)
    const modelResponse = $state<Promise<AiResponse>>(model.analyze(props.repoSummary))
</script>

{#await modelResponse}
    <Loading
        message="Summarizing the repository. This might take a while, depending on the size."
    />
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
