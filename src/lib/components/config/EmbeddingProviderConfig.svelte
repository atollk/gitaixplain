<script lang="ts">
    import { AiChatInterface, AiEmbeddingInterface } from "$lib/backend/ai_backend"
    import {
        GeminiEmbeddingInterface,
        LocalEmbeddingInterface,
        OllamaEmbeddingInterface,
        VoyageEmbeddingInterface,
    } from "$lib/backend/langchain_embedding_implementations"

    let { embeddingProvider, chatProvider } = $props<{
        embeddingProvider: AiEmbeddingInterface | null
        chatProvider: AiChatInterface
    }>()
</script>

<div class="flex h-10 items-center">
    <a
        class="badge badge-info badge-sm"
        href="https://www.github.com/atollk/gitaixplain/tree/main/docs/ModelConfig.md"
        rel="external"
        target="_blank"
    >
        ?
    </a>
</div>

<div class="flex w-lg flex-col gap-2">
    {#if embeddingProvider === null}
        {#if chatProvider.name === "Gemini" || chatProvider.name === "Ollama"}
            TODO
        {:else}
            <div role="alert" class="alert alert-warning">
                <img src="warning.svg" alt="Warning" />
                <span>
                    The selected model provider does not support embeddings. Certain features will
                    be unavailable or of reduced quality.
                </span>
            </div>
        {/if}
    {:else if embeddingProvider instanceof GeminiEmbeddingInterface}
        <div class="flex flex-col gap-2">
            <div class="flex items-center">
                <label
                    class="input input-bordered flex cursor-default items-center gap-2 select-none"
                >
                    API Key:
                    <input type="text" class="grow" bind:value={embeddingProvider.config.apiKey} />
                </label>
            </div>
        </div>
    {:else if embeddingProvider instanceof VoyageEmbeddingInterface}
        <div class="flex flex-col gap-2">
            <div class="flex items-center">
                <label
                    class="input input-bordered flex cursor-default items-center gap-2 select-none"
                >
                    API Key:
                    <input type="text" class="grow" bind:value={embeddingProvider.config.apiKey} />
                </label>
            </div>
        </div>
    {:else if embeddingProvider instanceof OllamaEmbeddingInterface}
        <div></div>
    {:else if embeddingProvider instanceof LocalEmbeddingInterface}
        <div class="alert info">
            <span>
                This will compute embeddings locally in your browser using CPU. Depending on your
                hardware and the repository, this can cause huge delays.
            </span>
        </div>
    {:else}
        Error. Unknown provider {embeddingProvider?.name}
    {/if}
</div>
