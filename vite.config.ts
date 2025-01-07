import { defineConfig } from "vitest/config"
import { sveltekit } from "@sveltejs/kit/vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"

export default defineConfig({
	plugins: [sveltekit(), nodePolyfills()],
	define: {
		"process.env": {},
		"process.version": JSON.stringify("v14.0.0"),
	},
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
})
