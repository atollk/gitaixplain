<script lang="ts">
    import ConfigModal from "$lib/components/config/ConfigModal.svelte"
    import { appStore } from "$lib/store.svelte"

    let githubUrl = $state("")
    let configModal: ConfigModal | undefined = $state()
    let modalResetKey = $state({})

    async function handleSubmit(e: SubmitEvent): Promise<void> {
        e.preventDefault()
        const urlPattern = /^(?:https:\/\/)?github\.com\/([^/]+)\/([^/]+)/
        const match = githubUrl.match(urlPattern)
        if (!match) {
            // TODO: nicer error message
            alert("Please enter a valid GitHub repository URL")
            return
        }
        appStore.gitUrl = githubUrl
    }
</script>

<form onsubmit={(e) => handleSubmit(e)} class="flex max-w-2xl flex-col items-center gap-6">
    <div class="form-control w-lg">
        <input
            bind:value={githubUrl}
            placeholder="Enter GitHub repository URL"
            class="input input-bordered w-full"
            required
        />
    </div>

    <div class="flex gap-6">
        <button class="btn w-48" type="button" onclick={() => configModal?.showModal()}>
            Configure
        </button>

        <button type="submit" class="btn btn-primary w-48"> Explain </button>
    </div>
</form>

{#key modalResetKey}
    <ConfigModal bind:this={configModal} onclose={() => modalResetKey = {}} />
{/key}
