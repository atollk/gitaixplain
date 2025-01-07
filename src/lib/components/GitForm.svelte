<script lang="ts">
	import { goto } from "$app/navigation"
	import type { Model } from "$lib/models"

	const props: {
		initialUrl: string;
		initialModel?: Model;
		initialApiKey: string;
	} = $props()

	let githubUrl = $state(props.initialUrl)
	let selectedModel = $state<Model>(props.initialModel ?? "ChatGpt")
	let apiKey = $state(props.initialApiKey)

	const models: Model[] = ["ChatGpt", "Claude", "Gemini"]

	function handleSubmit(e: SubmitEvent): void {
		e.preventDefault()
		const urlPattern = /^(?:https:\/\/)?github\.com\/([^\/]+)\/([^\/]+)/
		const match = githubUrl.match(urlPattern)

		if (!match) {
			alert("Please enter a valid GitHub repository URL")
			return
		}

		const [, owner, repo] = match
		const queryParams = new URLSearchParams({
			model: selectedModel,
			apiKey,
		})

		goto(`/${owner}/${repo}?${queryParams}`)
	}
</script>

<form onsubmit={(e) => handleSubmit(e)} class="flex flex-col gap-6">
	<div class="form-control w-full">
		<input
			bind:value={githubUrl}
			placeholder="Enter GitHub repository URL"
			class="input input-bordered w-full"
			required
		/>
	</div>

	<div class="flex gap-4">
		<select
			bind:value={selectedModel}
			class="select select-bordered w-40"
		>
			{#each models as model}
				<option value={model}>{model}</option>
			{/each}
		</select>

		<input
			bind:value={apiKey}
			placeholder="Enter API Key"
			class="input input-bordered flex-1"
			required
		/>
	</div>

	<button type="submit" class="btn btn-primary w-full">Submit</button>
</form>