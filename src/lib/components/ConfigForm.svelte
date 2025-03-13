<script lang="ts">
    import { goto } from "$app/navigation"
    import { apiList, type ApiName } from "$lib/models"
    import { base } from "$app/paths"
    import GeminiConfigForm from "$lib/backend/llm_providers/GeminiConfigForm.svelte"
    import GroqConfigForm from "$lib/backend/llm_providers/GroqConfigForm.svelte"
    import OllamaConfigForm from "$lib/backend/llm_providers/OllamaConfigForm.svelte"

    let {
        ...props
    }: {
        initialUrl: string
        initialApiName: ApiName
        initialConfig: { [fieldName: string]: any }
    } = $props()

    let githubUrl = $state(props.initialUrl)
    let apiName = $state(props.initialApiName)
    let config = $state(props.initialConfig)

    async function handleSubmit(e: SubmitEvent): Promise<void> {
        e.preventDefault()
        const urlPattern = /^(?:https:\/\/)?github\.com\/([^\/]+)\/([^\/]+)/
        const match = githubUrl.match(urlPattern)

        if (!match) {
            // TODO: nicer error message
            alert("Please enter a valid GitHub repository URL")
            return
        }

        const [, owner, repo] = match
        const queryParams = new URLSearchParams({
            api: apiName,
            config: JSON.stringify(config),
            git: `https://github.com/${owner}/${repo}`,
        })

        await goto(`${base}/repository/?${queryParams}`)
    }
</script>

<form onsubmit={(e) => handleSubmit(e)} class="flex max-w-2xl flex-col gap-6">
    <div class="form-control w-full">
        <input
            bind:value={githubUrl}
            placeholder="Enter GitHub repository URL"
            class="input input-bordered w-full"
            required
        />
    </div>

    <div class="flex gap-4">
        <select bind:value={apiName} class="select select-bordered w-40">
            {#each apiList as model}
                <option value={model}>{model}</option>
            {/each}
        </select>

        <div class="h-10 flex items-center">
            <a
                class="badge badge-info badge-sm"
                href="https://www.github.com/atollk/gitaixplain/tree/main/docs/ModelConfig.md"
                rel="external"
                target="_blank"
            >
                ?
            </a>
        </div>

        {#if apiName === "Gemini"}
            <GeminiConfigForm bind:config={config} />
        {:else if apiName === "Groq"}
            <GroqConfigForm bind:config={config} />
        {:else if apiName === "Ollama"}
            <OllamaConfigForm bind:config={config} />
        {:else}
            Error. Unknown API {apiName}
        {/if}
    </div>

    <button type="submit" class="btn btn-primary w-full">Submit</button>
</form>
