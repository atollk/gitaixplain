<script lang="ts" generics="ModelConfig">
    import { goto } from "$app/navigation"
    import { type ModelName, modelsList } from "$lib/models"
    import type { AiInterface } from "$lib/backend/ai_backend"
    import ModelConfigForm from "$lib/components/util/ModelConfigForm.svelte"

    let { modelName = $bindable(), ...props }: {
        initialUrl: string
        modelName: ModelName
        model: AiInterface<ModelConfig>
    } = $props()

    let githubUrl = $state(props.initialUrl)

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
            modelConfig: JSON.stringify(props.model.config),
        })

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

        <ModelConfigForm model={props.model} />
    </div>

    <button type="submit" class="btn btn-primary w-full">Submit</button>
</form>
