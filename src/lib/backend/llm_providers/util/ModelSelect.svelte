<script lang="ts">
    let {
        model = $bindable(),
        modelList,
    }: {
        model: string
        modelList: {name: string}[]
    } = $props()
</script>

<select bind:value={model} class="select select-bordered w-full max-w-xs">
    <option disabled selected>Model</option>
    {#each modelList as model}
        <option value={model.name}>{model.name}</option>
    {/each}
</select>
