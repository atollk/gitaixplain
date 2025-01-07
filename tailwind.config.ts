import type {Config} from 'tailwindcss';
import * as daisyui from 'daisyui';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],

    theme: {
        extend: {}
    },

    plugins: [
        daisyui.default,
    ]
} satisfies Config;
