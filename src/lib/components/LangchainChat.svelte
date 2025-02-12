<script lang="ts">
    import type { AiInterface } from "$lib/backend/ai_backend"
    import { Editor } from "@tiptap/core"
    import Document from "@tiptap/extension-document"
    import Paragraph from "@tiptap/extension-paragraph"
    import Text from "@tiptap/extension-text"
    import { onMount } from "svelte"

    const props: { model: AiInterface<any> } = $props()

    const messages: { text: string, byUser: boolean }[] = $state([])

    const submitMessage = (ev: SubmitEvent & { currentTarget: (EventTarget & HTMLFormElement) }) => {
        ev.preventDefault()
        messages.push({ text: editor?.getText({ blockSeparator: "\n" }) ?? "", byUser: true })
        const response = props.model.getChatResponse(messages)
        messages.push({ text: response, byUser: false })
        editor?.commands?.clearContent()
    }

    let editor: Editor | undefined

    onMount(() => {
        editor = new Editor({
            // bind Tiptap to the `.element`
            element: document.querySelector("#foo")!,
            // register extensions
            extensions: [Document, Paragraph, Text],
            // set the initial content
            content: "<p></p>",
            // place the cursor in the editor after initialization
            autofocus: true,
            // make the text editable (default is true)
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
            <div class="chat-bubble chat-bubble-primary whitespace-pre-line">
                {message.text}
            </div>
        </div>
    {/each}
</div>

<!--https://css-tricks.com/auto-growing-inputs-textareas/-->
<div>
    <form onsubmit={submitMessage}>
        <div class="relative textarea textarea-bordered textarea-xs flex items-center">
            <div id="foo" class="text-lg w-[40rem] max-h-48 overflow-scroll"></div>
            <button class="absolute right-3 border-solid border-2 border-primary rounded-full w-6 h-6 text-sm">🡲
            </button>
        </div>
    </form>
</div>
