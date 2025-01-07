<script lang="ts">
	import { doCall } from "$lib/gemini"
	import type { Model } from "$lib/models"

	interface Props {
		owner: string,
		repo: string,
		model: Model,
		apiKey: string,
	}

	const props: Props = $props()

	//const foo = doCall(props.apiKey)
</script>

a
<!--{#await foo then bar}-->
<!--{/await}-->
<!--{bar}-->
