<script lang="ts">
	import { page } from "$app/state"
	import Header from "$lib/components/Header.svelte"
	import GitForm from "$lib/components/GitForm.svelte"
	import Aixplanation from "$lib/components/Aixplanation.svelte"

	const { owner, repo } = page.params
	const urlParams = page.url.searchParams
	const model = urlParams.get("model") ?? ""
	const apiKey = urlParams.get("apiKey") ?? ""
</script>

<main class="container mx-auto max-w-2xl px-4 py-8">
	<Header />
	<GitForm
		initialUrl={`https://github.com/${owner}/${repo}`}
		initialModel={model}
		initialApiKey={apiKey}
	/>

	<div class="divider my-8"></div>

	<Aixplanation
		owner={owner}
		repo={repo}
		model={model}
		apiKey={apiKey}
	/>
</main>