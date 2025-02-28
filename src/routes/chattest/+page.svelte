<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import LangchainChat from "$lib/components/LangchainChat.svelte"
    import { GeminiInterface } from "$lib/backend/langchain_implementations"

    const valid = () => {
        const x = document.getElementById("foo") as HTMLInputElement
        x.setCustomValidity("a")
        //console.log(x.reportValidity())
    }
</script>

<main class="container mx-auto flex max-w-4xl flex-col items-center px-4 py-8">
    <Header />
    <LangchainChat
        model={new GeminiInterface({model: "gemini-1.5-flash", apiKey: "AIzaSyAny6NBpPmVlzCKCcOhVAHk6GY7XIq5dDw"})} />

    <form>
        <input id="foo" onfocusout={valid} type="text" class="input validator" placeholder="foo" onsubmit={valid} />
        <button class="btn" type="submit">X</button>
    </form>

</main>
