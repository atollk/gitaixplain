<script lang="ts">
    import type { AiInterface } from "$lib/backend/ai_backend"
    import { Editor, Extension } from "@tiptap/core"
    import Document from "@tiptap/extension-document"
    import Paragraph from "@tiptap/extension-paragraph"
    import Text from "@tiptap/extension-text"
    import { onMount } from "svelte"
    import { marked } from "marked"
    import Loading from "$lib/components/util/Loading.svelte"
    import { approximateTokens, countTokens } from "$lib/backend/util"
    import type { RepositoryDump } from "$lib/backend/repository_dump"

    const props: { repositoryDump: RepositoryDump, aiInterface: AiInterface } = $props()

    const messages: { text: string; byUser: boolean }[] = $state([])
    let waitingForModel = $state(false)

    const SYSTEM_PROMPT_1 =
        "Use the following context that is part of a git repository to answer questions. Be as detailed as possible, but don't make up any information that's not from the context."
    const SYSTEM_PROMPT_2 =
        "Consider the following conversation. Your job is to determine how much information you need o respond to the last user message. Simply answer with a single number from 1 to 10, where 1 is a single file and 10 is the entire repository."

    const submitMessage = async (
        ev?: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement },
    ) => {
        ev?.preventDefault()
        const userMessage = editor?.getText({ blockSeparator: "\n" }) ?? ""
        messages.push({ text: userMessage, byUser: true })
        editor!.commands!.clearContent()

        waitingForModel = true
        try {
            // Find out how much context is needed.
            const contextNeeded = parseInt(await props.aiInterface.chatInterface.getChatResponse(SYSTEM_PROMPT_2, messages))
            console.log("contextNeeded", contextNeeded, props.repositoryDump.countFiles() * 10 / contextNeeded)

            // Build the context
            const contexts = await props.aiInterface.embeddingInterface?.getContext(userMessage, props.repositoryDump.countFiles() * 10 / contextNeeded) ?? []
            let systemPrompt = `${SYSTEM_PROMPT_1}\n`
            const baseTokens = countTokens(systemPrompt) + messages.map((m) => countTokens(m.text)).reduce((a, b) => a+b, 0)
            for (const context of contexts) {
                if (baseTokens + approximateTokens(context) >= props.aiInterface.chatInterface.getContextWindowSize())
                    break
                systemPrompt = systemPrompt + "\n" + context
            }
            const response = await props.aiInterface.chatInterface.getChatResponse(
                systemPrompt,
                messages,
            )
            messages.push({ text: response, byUser: false })
        } finally {
            waitingForModel = false
        }
    }

    let editorElement: HTMLElement | undefined
    let editor: Editor | undefined

    onMount(() => {
        const keybordShortcutsExtension = Extension.create({
            addKeyboardShortcuts() {
                return {
                    "Control-Enter": () => {
                        submitMessage()
                        return true
                    },
                    "Shift-Enter": () =>
                        editor!.chain().selectParentNode().createParagraphNear().focus().run(),
                }
            },
        })
        editor = new Editor({
            element: editorElement,
            extensions: [Document, Paragraph, Text, keybordShortcutsExtension],
            content: "<p></p>",
            autofocus: false,
            editable: true,
            // prevent loading the default CSS (which isn't much anyway)
            injectCSS: false,
        })
        return () => editor?.destroy()
    })
</script>

<div class="flex w-4/5 flex-col">
    {#each messages as message}
        <div class={["chat", message.byUser ? "chat-end" : "chat-start"]}>
            <div
                class={[
                    "marked",
                    "chat-bubble",
                    "text-wrap",
                    message.byUser ? "chat-bubble-primary" : "chat-bubble-secondary",
                ]}
            >
                {@html marked.parse(message.text)}
            </div>
        </div>
    {/each}
    {#if waitingForModel}
        <div class="chat chat-start">
            <div class="chat-bubble chat-bubble-secondary whitespace-pre-line">
                <Loading message="" />
            </div>
        </div>
    {/if}
</div>

<div class="contents">
    <form onsubmit={submitMessage} class="contents">
        <div
            class="textarea textarea-bordered textarea-xs relative flex min-h-0 w-[40rem] items-center"
        >
            <div
                bind:this={editorElement}
                class="mr-10 max-h-48 w-[40rem] overflow-scroll text-lg"
            ></div>
            <button
                type="submit"
                class="border-primary absolute right-3 h-6 w-6 rounded-full border-2 border-solid text-sm"
                >🡲
            </button>
        </div>
    </form>
</div>

<style>
    .marked :global(ul) {
        list-style: disc;
    }
</style>
