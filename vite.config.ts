import { defineConfig } from "vitest/config"
import { sveltekit } from "@sveltejs/kit/vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"

export default defineConfig({
    plugins: [wasm(), topLevelAwait(), sveltekit(), nodePolyfills()],
    define: {
        "process.env": {},
        "process.version": JSON.stringify("v14.0.0"),
    },
    test: {
        include: ["src/**/*.{test,spec}.{js,ts}"],
    },
})
