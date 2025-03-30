<script>
    let { class: className = "" } = $props()
</script>

<header class="mb-12 max-w-2xl text-center {className}">
    <div class="flex items-center space-x-32">
        <div></div>
        <div>
            <a
                class="text-primary text-4xl font-bold hover:cursor-pointer hover:underline"
                href="/"
            >
                Gitaixplain
            </a>
            <sup class="align-top text-sm">alpha</sup>
        </div>
        <a href="https://github.com/atollk/gitaixplain/" target="_blank">
            <img src="github-mark.svg" alt="GitHub logo" class="w-8 hover:brightness-200" />
        </a>
    </div>
    Understand git repositories faster than ever.
</header>
