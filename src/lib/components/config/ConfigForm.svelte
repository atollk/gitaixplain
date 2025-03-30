<script lang="ts">
    import { goto } from "$app/navigation"
    import {
        chatProviderList,
        type ChatProviderName,
        embeddingProviderList,
        type EmbeddingProviderName,
    } from "$lib/models"
    import { chatProviderNameToInterface } from "$lib/backend/langchain_chat_implementations"
    import {
        type AiChatInterface,
        AiEmbeddingInterface,
        AiInterface,
    } from "$lib/backend/ai_backend"
    import { embeddingProviderNameToInterface } from "$lib/backend/langchain_embedding_implementations"
    import ChatProviderConfig from "$lib/components/config/ChatProviderConfig.svelte"
    import EmbeddingProviderConfig from "$lib/components/config/EmbeddingProviderConfig.svelte"
    import { store } from "$lib/store.svelte"

    let chatProviderSelectElement: HTMLSelectElement | undefined = $state()

    let githubUrl = $state("")
    let embeddingProviderName: EmbeddingProviderName = $state(embeddingProviderList[0])
    let chatProvider: AiChatInterface = $state(getChatProvider())
    let embeddingProvider: AiEmbeddingInterface | null = $derived.by(() => {
        if (embeddingProviderName === null) return null
        const clas = embeddingProviderNameToInterface(embeddingProviderName)
        return new clas({})
    })
    let useCustomEmbedding = $state(false)

    function getChatProvider(): AiChatInterface {
        const name = (chatProviderSelectElement?.value as ChatProviderName) ?? chatProviderList[0]
        const clas = chatProviderNameToInterface(name)
        return new clas({})
    }

    async function handleSubmit(e: SubmitEvent): Promise<void> {
        e.preventDefault()
        const urlPattern = /^(?:https:\/\/)?github\.com\/([^/]+)\/([^/]+)/
        const match = githubUrl.match(urlPattern)

        if (!match) {
            // TODO: nicer error message
            alert("Please enter a valid GitHub repository URL")
            return
        }

        store.gitUrl = githubUrl
        store.aiInterface = new AiInterface(
            chatProvider,
            useCustomEmbedding
                ? embeddingProvider
                : chatProvider.providesEmbeddings()
                  ? chatProvider.getEmbeddingProvider()
                  : null,
        )
        store.aiInterface.chatInterface.reset()
        store.aiInterface.embeddingInterface.reset()
    }

    $inspect(chatProvider, embeddingProvider)
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
        <select
            bind:this={chatProviderSelectElement}
            onchange={() => {
                chatProvider = getChatProvider()
            }}
            class="select select-bordered w-40"
        >
            {#each chatProviderList as provider}
                <option value={provider}>{provider}</option>
            {/each}
        </select>

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
            <ChatProviderConfig bind:chatProvider />
        </div>
    </div>

    <details class="collapse-arrow bg-base-100 border-base-300 collapse border">
        <summary class="collapse-title">
            Embedding Provider
            {#if !chatProvider.providesEmbeddings() && !useCustomEmbedding}
                <div class="badge badge-warning p-0">
                    <img src="warning.svg" alt="Warning" class="w-4" />
                </div>
            {/if}
        </summary>
        <div class="collapse-content">
            <div class="mb-4 flex gap-4">
                <input
                    type="checkbox"
                    bind:checked={useCustomEmbedding}
                    class="checkbox checkbox-secondary"
                />
                <p>Use a different embedding provider</p>
            </div>

            {#if useCustomEmbedding}
                <div class="flex gap-4">
                    <select bind:value={embeddingProviderName} class="select select-bordered w-40">
                        {#each embeddingProviderList as provider}
                            <option value={provider}>{provider}</option>
                        {/each}
                    </select>

                    <EmbeddingProviderConfig {embeddingProvider} {chatProvider} />
                </div>
            {:else if !chatProvider.providesEmbeddings()}
                <div class="alert alert-warning">
                    <img src="warning.svg" alt="Warning" />
                    <span>
                        The selected model provider does not support embeddings. Certain features
                        will be unavailable or of reduced quality.
                    </span>
                </div>
            {/if}
        </div>
    </details>

    <button type="submit" class="btn btn-primary w-full">Submit</button>
</form>
