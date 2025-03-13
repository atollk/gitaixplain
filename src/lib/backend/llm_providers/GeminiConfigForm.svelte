<script lang="ts">
    import { GeminiInterface } from "$lib/backend/llm_providers/gemini"
    import ModelSelect from "$lib/backend/llm_providers/util/ModelSelect.svelte"

    const { config }: { config: { [fieldName: string]: any } } = $props()
</script>

<div class="flex flex-col gap-2">
    <div class="flex items-center">
        <label class="input input-bordered flex cursor-default items-center gap-2 select-none">
            API Key:
            <input type="text" class="grow" bind:value={config.apiKey} />
        </label>
    </div>

    <ModelSelect bind:model={config.model} modelList={GeminiInterface.models}/>
</div>
