<script>
	import { goto } from "$app/navigation"

	let { class: className = "" } = $props()
</script>

<header class="text-center mb-12 {className}">
	<a class="text-4xl font-bold text-primary hover:cursor-pointer hover:underline" href="/">Gitaixplain</a>
</header>