<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import ConfigForm from "$lib/components/ConfigForm.svelte"
    import { chatProviderList } from "$lib/models.js"
    import Footer from "$lib/components/Footer.svelte"
</script>

<main class="container mx-auto flex max-w-4xl flex-col items-center px-4 py-8">
    <Header />
    <ConfigForm
        initialUrl=""
        initialApiName={chatProviderList[0]}
        initialConfig={{}}
    />
</main>

<footer>
    <Footer />
</footer>