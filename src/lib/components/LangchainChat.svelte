<script lang="ts">
    import type { AiInterface } from "$lib/backend/ai_backend"
    import { Editor, Extension } from "@tiptap/core"
    import Document from "@tiptap/extension-document"
    import Paragraph from "@tiptap/extension-paragraph"
    import Text from "@tiptap/extension-text"
    import { onMount } from "svelte"
    import { marked } from "marked"

    const props: { model: AiInterface<any> } = $props()

    const messages: { text: string, byUser: boolean }[] = $state([])

    const submitMessage = async (ev?: SubmitEvent & { currentTarget: (EventTarget & HTMLFormElement) }) => {
        ev?.preventDefault()
        const userMessage = editor?.getText({ blockSeparator: "\n" }) ?? ""
        messages.push({ text: userMessage, byUser: true })
        editor!.commands!.clearContent()

        const context: string = await props.model.getContext(userMessage)
        const systemPrompt = `Use the following context to answer questions. Be as detailed as possible, but don't make up any information that's not from the context. If you don't know an answer, say you don't know.\n\n${context}`
        const response = await props.model.getChatResponse(systemPrompt, messages)
        messages.push({ text: response, byUser: false })
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
                    "Shift-Enter": () => editor!.chain().selectParentNode().createParagraphNear().focus().run(),
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

<div class="flex flex-col w-4/5">
    {#each messages as message}
        <div class={["chat", message.byUser ? "chat-end" : "chat-start"]}>
            <div
                class={["marked", "chat-bubble", "whitespace-pre-line", message.byUser ? "chat-bubble-primary" : "chat-bubble-secondary"]}>
                {@html marked.parse(message.text)}
            </div>
        </div>
    {/each}
</div>

<div>
    <form onsubmit={submitMessage}>
        <div class="relative textarea textarea-bordered textarea-xs flex items-center">
            <div bind:this={editorElement} class="text-lg w-[40rem] max-h-48 overflow-scroll mr-10"></div>
            <button type="submit"
                    class="absolute right-3 border-solid border-2 border-primary rounded-full w-6 h-6 text-sm">🡲
            </button>
        </div>
    </form>
</div>

<style>
    .marked :global(ul) {
        list-style: disc;
    }
</style>