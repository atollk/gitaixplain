<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import ConfigForm from "$lib/components/ConfigForm.svelte"
    import { modelsList } from "$lib/models.js"
</script>

<main class="container mx-auto flex max-w-4xl flex-col items-center px-4 py-8">
    <Header />
    <ConfigForm
        initialUrl=""
        initialModelName={modelsList[0]}
        initialConfig={{}}
    />
</main>
