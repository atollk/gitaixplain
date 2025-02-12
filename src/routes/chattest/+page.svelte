<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import LangchainChat from "$lib/components/LangchainChat.svelte"
    import { GeminiInterface } from "$lib/backend/langchain_implementations"
</script>

<main class="container mx-auto flex max-w-4xl flex-col items-center px-4 py-8">
    <Header />
    <LangchainChat
        model={new GeminiInterface({model: "gemini-1.5-flash", apiKey: "AIzaSyAny6NBpPmVlzCKCcOhVAHk6GY7XIq5dDw"})} />
</main>
