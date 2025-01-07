import type {Config} from 'tailwindcss';
import * as daisyui from 'daisyui';

export default {
	content: ["./src/**/*.{html,js,svelte,ts}"],

	theme: {
		mytheme: {
			primary: "#3b82f6",
			secondary: "#16a34a",
			accent: "#4338ca",
			neutral: "#170c0e",
			"base-100": "#361810",
			info: "#a5f3fc",
			success: "#a3e635",
			warning: "#fef08a",
			error: "#f87171",
		},
	},

	plugins: [daisyui.default],

	daisyui: {
		themes: ["coffee"],
	},
} satisfies Config
