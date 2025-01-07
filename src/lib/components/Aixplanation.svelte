<script lang="ts">
	import { doCall, fetchRepoSummary } from "$lib/gemini"
	import type { Model } from "$lib/models"
	import { instance } from "@viz-js/viz"

	interface Props {
		owner: string,
		repo: string,
		model: Model,
		apiKey: string,
	}

	const props: Props = $props()
	let text = $state("")
	let graphviz: SVGElement | undefined = $state()
	let graphvizRaw = $state("")

	async function getContent(): Promise<void> {
		const repoSummary = await fetchRepoSummary(`https://github.com/${props.owner}/${props.repo}`)
		const repoAixplain = await doCall(props.apiKey, repoSummary)
		const split = repoAixplain.split("!GRAPHSTART")
		text = split[0]
		graphvizRaw = split[1]
		const viz = await instance()
		graphviz = viz.renderSVGElement(graphvizRaw.replaceAll(/.*```.*/g, ""))
	}

	getContent()
</script>

<div class="flex justify-center items-center flex-col">
	{#if text === ""}
		<div class="flex flex-col items-center gap-4">
			<p class="text-lg">Loading your repository. This might take a while, depending on the size.</p>
			<span class="loading loading-dots loading-lg"></span>
		</div>
	{:else}
		{text}

		{@html graphviz?.outerHTML}
	{/if}
</div>