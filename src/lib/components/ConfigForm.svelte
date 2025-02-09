<script lang="ts">
    import { goto } from "$app/navigation"
    import { apiList, type ApiName } from "$lib/models"
    import { GeminiInterface, GroqInterface } from "$lib/backend/langchain_implementations"

    let { ...props }: {
        initialUrl: string
        initialApiName: ApiName
        initialConfig: { [fieldName: string]: any }
    } = $props()

    let githubUrl = $state(props.initialUrl)
    let apiName = $state(props.initialApiName)
    let config = $state(props.initialConfig)

    function handleSubmit(e: SubmitEvent): void {
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
        })

        // TODO: actually force a refresh, don't just change the contents of the URL bar
        goto(`/${owner}/${repo}?${queryParams}`)
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

        <div>
            {#if apiName === "Gemini"}
                <div>
                    <label>
                        API Key
                        <input type=text bind:value={ config.apiKey } />
                    </label>

                    <label>
                        Model
                        <select>
                            {#each GeminiInterface.models as model}
                                <option value={model.name}>{model.name}</option>
                            {/each}
                        </select>
                    </label>
                </div>
            {:else if apiName === "Groq"}
                <div>
                    <label>
                        API Key
                        <input type=text bind:value={ config.apiKey } />
                    </label>

                    <label>
                        Model
                        <select>
                            {#each GroqInterface.models as model}
                                <option value={model.name}>{model.name}</option>
                            {/each}
                        </select>
                    </label>
                </div>
            {:else if apiName === "Ollama"}
                <div>
                    <label>
                        Context Size
                        <input type=number bind:value={ config.contextWindowSize } />
                    </label>
                </div>
            {:else}
                Error. Unknown API {apiName}
            {/if}
        </div>
    </div>

    <button type="submit" class="btn btn-primary w-full">Submit</button>
</form>
