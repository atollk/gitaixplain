<script lang="ts">
    import { fetchRepoDump } from "$lib/backend/repository_dump"
    import Loading from "$lib/components/util/Loading.svelte"
    import { approximateTokens, countTokens } from "$lib/backend/util"

    const repoDumpPromise = (async () => {
        const dump = await fetchRepoDump("https://github.com/stacks-sbtc/sbtc", /a^/)
        const x: [string, number][] = []
        const a = dump.fileContent.map(
            (directoryInfo, children) =>
                [
                    Object.values(children)
                        .map((x) => x[0])
                        .join("\n"),
                    null,
                ] as const,
            (fileInfo) => {
                x.push([fileInfo.path, approximateTokens(fileInfo.content)])
                return ["", null]
            },
        )
        return x.toSorted((a, b) => b[1] - a[1])
    })()
</script>

{#await repoDumpPromise}
    <Loading message="" />
{:then repoDump}
    <ul>
        {#each repoDump as file}
            <li>
                {file[0]}  ({file[1]})
            </li>
        {/each}
    </ul>
{/await}
