<script lang="ts">
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
    import { appStore } from "$lib/store.svelte"

    export function showModal() {
        dialogElement?.showModal()
    }

    let chatProviderSelectElement: HTMLSelectElement | undefined = $state()
    let embeddingProviderSelectElement: HTMLSelectElement | undefined = $state()
    let dialogElement: HTMLDialogElement | undefined = $state()

    let chatProvider: AiChatInterface = $state(
        appStore.aiInterface?.chatInterface ?? getChatProvider(),
    )
    let embeddingProvider: AiEmbeddingInterface | null = $state(
        appStore.aiInterface?.embeddingInterface ?? getEmbeddingProvider(),
    )

    let useCustomEmbedding = $state(false)
    let saveSettings = $state(appStore.useLocalStorage)

    function getChatProvider(): AiChatInterface {
        const name = (chatProviderSelectElement?.value as ChatProviderName) ?? chatProviderList[0]
        const clas = chatProviderNameToInterface(name)
        return new clas({})
    }
    function getEmbeddingProvider(): AiEmbeddingInterface | null {
        const name =
            (embeddingProviderSelectElement?.value as EmbeddingProviderName) ??
            embeddingProviderList[0]
        const clas = embeddingProviderNameToInterface(name)
        return new clas({})
    }

    async function handleSubmit(): Promise<void> {
        appStore.useLocalStorage = saveSettings
        appStore.aiInterface = new AiInterface(
            chatProvider,
            useCustomEmbedding
                ? embeddingProvider
                : chatProvider.providesEmbeddings()
                  ? chatProvider.getEmbeddingProvider()
                  : null,
        )
        appStore.aiInterface.chatInterface.reset()
        appStore.aiInterface.embeddingInterface?.reset()
    }
</script>

<dialog bind:this={dialogElement} class="modal">
    <div class="modal-box">
        <form method="dialog" onsubmit={handleSubmit} class="flex flex-col gap-6">
            <div class="divider">Chat Model</div>

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

            <div class="divider">Embedding Model</div>

            <div>
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
                        <select
                            bind:this={embeddingProviderSelectElement}
                            onchange={() => {
                                embeddingProvider = getEmbeddingProvider()
                            }}
                            class="select select-bordered w-40"
                        >
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
                            The selected model provider does not support embeddings. Certain
                            features will be unavailable or of reduced quality.
                        </span>
                    </div>
                {/if}
            </div>

            <div class="divider"></div>

            <div class="mb-4 flex gap-4">
                <input
                    type="checkbox"
                    bind:checked={saveSettings}
                    class="checkbox checkbox-secondary"
                />
                <p>Save these settings in your browser storage</p>
            </div>

            <div class="modal-action">
                <button type="submit" class="btn">Save</button>
            </div>
        </form>
    </div>

    <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2 text-lg">✕</button>
    <form method="dialog" class="modal-backdrop">
        <button aria-label="close"></button>
    </form>
</dialog>
