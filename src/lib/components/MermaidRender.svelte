<script lang="ts">
    import mermaid from "mermaid"
    import { onMount } from "svelte"
    import { initMermaid } from "$lib/backend"
    import createPanZoom from "panzoom"

    const props: {
        svgId: string,
        mermaidSpec: string,
    } = $props()

    let svgElement = $state<HTMLElement | SVGElement>()

    const renderPromise = mermaid.render(props.svgId, props.mermaidSpec)

    onMount(() => {
        initMermaid()

        renderPromise.then(() => {
            // Wait for next tick to ensure the SVG is in the DOM
            Promise.resolve().then(() => {
                if (svgElement) {
                    createPanZoom(svgElement, {})
                }
            })
        })
    })
</script>

<div class="w-full overflow-hidden">
    <div bind:this={svgElement}>
        {#await renderPromise then render}
            {@html render.svg}
        {/await}
    </div>
</div>