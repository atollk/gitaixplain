<script>
    import Header from "$lib/components/Header.svelte"
    import GitForm from "$lib/components/GitForm.svelte"
</script>

<main class="container mx-auto flex max-w-4xl flex-col items-center px-4 py-8">
    <Header />
    <GitForm initialUrl="" initialModel={undefined} initialApiKey="" />
</main>
