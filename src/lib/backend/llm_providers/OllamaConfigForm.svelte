<script lang="ts">
    const { config=$bindable() }: { config: { [fieldName: string]: any } } = $props()
</script>

<div class="flex flex-col items-center gap-2">
    <label class="input input-bordered flex items-center gap-2">
        Context Size:
        <input type="number" class="grow" bind:value={config.contextWindowSize} />
    </label>

    <div class="tooltip">
        <div class="tooltip-content">hello</div>
        <div class="badge badge-info">CORS setup</div>
    </div>
</div>