<script lang="ts">
    import { goto } from "$app/navigation"
    import { chatProviderList, type ChatProviderName } from "$lib/models"
    import { GeminiInterface, GroqInterface } from "$lib/backend/langchain_implementations"
    import { base } from "$app/paths"

    let {
        ...props
    }: {
        initialUrl: string
        initialApiName: ChatProviderName
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
            {#each chatProviderList as model}
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
            <div class="flex flex-col gap-2">
                <div class="flex items-center">
                    <label
                        class="input input-bordered flex cursor-default items-center gap-2 select-none"
                    >
                        API Key:
                        <input type="text" class="grow" bind:value={config.apiKey} />
                    </label>
                </div>

                <select bind:value={config.model} class="select select-bordered w-full max-w-xs">
                    <option disabled selected>Model</option>
                    {#each GeminiInterface.models as model}
                        <option value={model.name}>{model.name}</option>
                    {/each}
                </select>
            </div>
        {:else if apiName === "Groq"}
            <div class="flex flex-col gap-2">
                <label class="input input-bordered flex items-center gap-2">
                    API Key:
                    <input type="text" class="grow" bind:value={config.apiKey} />
                </label>

                <select bind:value={config.model} class="select select-bordered w-full max-w-xs">
                    <option disabled selected>Model</option>
                    {#each GroqInterface.models as model}
                        <option value={model.name}>{model.name}</option>
                    {/each}
                </select>
            </div>
        {:else if apiName === "Ollama"}
            <div class="flex flex-col items-center gap-2">
                <label class="input input-bordered flex items-center gap-2">
                    Context Size:
                    <input type="number" class="grow" bind:value={config.contextWindowSize} />
                </label>

                <div class="tooltip">
                    <div class="tooltip-content">hello</div>
                    <div class="badge badge-info">CORS setup</div>
                </div>
            </div>
        {:else}
            Error. Unknown API {apiName}
        {/if}
    </div>

    <button type="submit" class="btn btn-primary w-full">Submit</button>
</form>
