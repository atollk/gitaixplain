<script lang="ts">
    const props: {
        message: string
    } = $props()
</script>

<div class="flex flex-col items-center gap-4">
    <p class="text-lg">{props.message}</p>
    <span class="loading loading-dots loading-lg"></span>
</div>
