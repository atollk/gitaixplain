<script lang="ts">
    import { goto } from "$app/navigation"
    import { type ModelName, modelsList } from "$lib/models"
    import ModelConfigForm, { modelConfigFields } from "$lib/components/util/ModelConfigForm.svelte"

    let { ...props }: {
        initialUrl: string
        initialModelName: ModelName
        initialConfig: object
    } = $props()

    let githubUrl = $state(props.initialUrl)
    let modelName = $state(props.initialModelName)
    let modelConfig = $state(props.initialConfig)

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
            model: modelName,
            modelConfig: JSON.stringify(modelConfig),
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
        <select bind:value={modelName} class="select select-bordered w-40">
            {#each modelsList as model}
                <option value={model}>{model}</option>
            {/each}
        </select>

        <ModelConfigForm fields={modelConfigFields[modelName]} bind:config={modelConfig} />
    </div>

    <button type="submit" class="btn btn-primary w-full">Submit</button>
</form>
