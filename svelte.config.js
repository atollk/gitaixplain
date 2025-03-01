import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"
import adapter from "@sveltejs/adapter-static"

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://svelte.dev/docs/kit/integrations
    // for more information about preprocessors
    preprocess: vitePreprocess({ script: true }),

    kit: {
        adapter: adapter({
            fallback: "404.html",
        }),
        paths: {
            base: "",
        },
        alias: {
            "@": "./src",
        },
        prerender: {
            handleHttpError: "fail",
        },
    },
}

export default config
