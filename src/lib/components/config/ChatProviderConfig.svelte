<script lang="ts">
    import { AiChatInterface } from "$lib/backend/ai_backend"
    import {
        AnthropicChatInterface,
        GeminiChatInterface,
        GroqChatInterface,
        OllamaChatInterface,
    } from "$lib/backend/langchain_chat_implementations"

    let { chatProvider = $bindable() } = $props<{ chatProvider: AiChatInterface }>()
</script>

{#if chatProvider instanceof GeminiChatInterface}
    <div class="flex flex-col gap-2">
        <div class="flex items-center">
            <label class="input input-bordered flex cursor-default items-center gap-2 select-none">
                API Key:
                <input type="text" class="grow" bind:value={chatProvider.config.apiKey} />
            </label>
        </div>

        <select
            bind:value={chatProvider.config.modelName}
            class="select select-bordered w-full max-w-xs"
        >
            <option disabled selected>Model</option>
            {#each GeminiChatInterface.models as model}
                <option value={model.name}>{model.name}</option>
            {/each}
        </select>
    </div>
{:else if chatProvider instanceof GroqChatInterface}
    <div class="flex flex-col gap-2">
        <label class="input input-bordered flex items-center gap-2">
            API Key:
            <input type="text" class="grow" bind:value={chatProvider.config.apiKey} />
        </label>

        <select
            bind:value={chatProvider.config.modelName}
            class="select select-bordered w-full max-w-xs"
        >
            <option disabled selected>Model</option>
            {#each GroqChatInterface.models as model}
                <option value={model.name}>{model.name}</option>
            {/each}
        </select>
    </div>
{:else if chatProvider instanceof AnthropicChatInterface}
    <div class="flex flex-col gap-2">
        <label class="input input-bordered flex items-center gap-2">
            API Key:
            <input type="text" class="grow" bind:value={chatProvider.config.apiKey} />
        </label>

        <select
            bind:value={chatProvider.config.modelName}
            class="select select-bordered w-full max-w-xs"
        >
            <option disabled selected>Model</option>
            {#each AnthropicChatInterface.models as model}
                <option value={model.name}>{model.name}</option>
            {/each}
        </select>
    </div>
{:else if chatProvider instanceof OllamaChatInterface}
    <div class="flex flex-col gap-2">
        <label class="input input-bordered flex items-center gap-2">
            Context Size:
            <input type="number" class="grow" bind:value={chatProvider.config.contextWindowSize} />
        </label>

        <div class="tooltip">
            <div class="tooltip-content">hello</div>
            <div class="badge badge-info">CORS setup</div>
        </div>
    </div>
{:else}
    Error. Unknown provider {chatProvider.name}
{/if}
