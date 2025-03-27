<script lang="ts">
    import { goto } from "$app/navigation"
    import {
        chatProviderList,
        type ChatProviderName,
        embeddingProviderList,
        type EmbeddingProviderName,
    } from "$lib/models"
    import { base } from "$app/paths"
    import {
        chatProviderNameToInterface,
        GeminiChatInterface,
        GroqChatInterface,
    } from "$lib/backend/langchain_chat_implementations"
    import { type AiChatInterface, AiRAGInterface } from "$lib/backend/ai_backend"
    import { embeddingProviderNameToInterface } from "$lib/backend/langchain_rag_implementations"

    let githubUrl = $state("")
    let chatProviderName: ChatProviderName = $state(chatProviderList[0])
    let embeddingProviderName: EmbeddingProviderName | null = $state(null)
    let chatProvider: AiChatInterface = $derived.by(() => {
        const clas = chatProviderNameToInterface(chatProviderName)
        return new clas(config)
    })
    let embeddingProvider: AiRAGInterface | null = $derived.by(() => {
        if (embeddingProviderName === null)
            return null
        const clas = embeddingProviderNameToInterface(embeddingProviderName)
        return new clas(config)
    })
    let config: Record<string, unknown> = $state({})

    async function handleSubmit(e: SubmitEvent): Promise<void> {
        e.preventDefault()
        const urlPattern = /^(?:https:\/\/)?github\.com\/([^/]+)\/([^/]+)/
        const match = githubUrl.match(urlPattern)

        if (!match) {
            // TODO: nicer error message
            alert("Please enter a valid GitHub repository URL")
            return
        }

        const [, owner, repo] = match
        const queryParams = new URLSearchParams({
            api: chatProviderName,
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

    <div class="divider">
        Model Provider
    </div>

    <div class="flex gap-4">
        <select bind:value={chatProviderName} class="select select-bordered w-40">
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

        <div class="flex flex-col gap-2 w-lg">
            {#if chatProviderName === "Gemini"}
                <div class="flex flex-col gap-2">
                    <div class="flex items-center">
                        <label
                            class="input input-bordered flex cursor-default items-center gap-2 select-none"
                        >
                            API Key:
                            <input type="text" class="grow" bind:value={config.apiKey} />
                        </label>
                    </div>

                    <select
                        bind:value={config.model}
                        class="select select-bordered w-full max-w-xs"
                    >
                        <option disabled selected>Model</option>
                        {#each GeminiChatInterface.models as model}
                            <option value={model.name}>{model.name}</option>
                        {/each}
                    </select>
                </div>
            {:else if chatProviderName === "Groq"}
                <div class="flex flex-col gap-2">
                    <label class="input input-bordered flex items-center gap-2">
                        API Key:
                        <input type="text" class="grow" bind:value={config.apiKey} />
                    </label>

                    <select
                        bind:value={config.model}
                        class="select select-bordered w-full max-w-xs"
                    >
                        <option disabled selected>Model</option>
                        {#each GroqChatInterface.models as model}
                            <option value={model.name}>{model.name}</option>
                        {/each}
                    </select>
                </div>
            {:else if chatProviderName === "Ollama"}
                <div class="flex flex-col gap-2">
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
                Error. Unknown provider {chatProviderName}
            {/if}

            <details class="collapse-arrow bg-base-100 border-base-300 collapse border">
                <summary class="collapse-title font-semibold">How do I create an account?</summary>
                <div class="collapse-content text-sm">
                    Click the "Sign Up" button in the top right corner and follow the registration
                    process.
                </div>
            </details>
        </div>
    </div>

    <div class="divider">
        Embedding Provider
    </div>


    <div class="flex gap-4">
        <select bind:value={embeddingProviderName} class="select select-bordered w-40">
            <option value={null}>(same as model provider)</option>
            {#each embeddingProviderList as provider}
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

        <div class="flex flex-col gap-2 w-lg">
            {#if embeddingProviderName === null}
                {#if chatProviderName === "Gemini" || chatProviderName === "Ollama"}
                    TODO
                {:else}
                    <div role="alert" class="alert alert-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none"
                             viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>The selected model provider does not support embeddings. Certain features will be unavailable or of reduced quality.</span>
                    </div>
                {/if}
            {:else if embeddingProviderName === "Gemini"}
                <div class="flex flex-col gap-2">
                    <div class="flex items-center">
                        <label
                            class="input input-bordered flex cursor-default items-center gap-2 select-none"
                        >
                            API Key:
                            <input type="text" class="grow" bind:value={config.apiKey} />
                        </label>
                    </div>
                </div>
            {:else}
                Error. Unknown provider {embeddingProviderName}
            {/if}
        </div>
    </div>

    <button type="submit" class="btn btn-primary w-full">Submit</button>
</form>
