import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html', // Essential for SPAs on GitHub Pages
			precompress: false,
			strict: true
		}),
		paths: {
			// Replace 'Cloud-Orchestrator' with your actual repository name
			base: process.env.NODE_ENV === 'production' ? '/Cloud-Orchestrator' : '',
		}
	}
};

export default config;