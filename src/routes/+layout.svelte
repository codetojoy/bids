<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import { base } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { applyTheme, loadSettings } from '$lib/ui/settings';

	let { children } = $props();

	onMount(() => {
		// Stamp the saved theme on <html> (TODO-003). Reading localStorage is browser-only,
		// so it happens here rather than during init — the routes are all prerendered.
		applyTheme(loadSettings().themeId);

		// Register the service worker ourselves, production-only. SvelteKit's
		// auto-registration is disabled (serviceWorker.register: false in vite.config.ts)
		// because it also fires in dev as a module worker that Chrome can't evaluate.
		// The built worker is a classic script served at `${base}/service-worker.js`.
		if (!dev && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register(`${base}/service-worker.js`);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	/*
	 * The self-hosted @font-face rules live in src/app.html so their URLs can be
	 * base-path-aware via %sveltekit.assets% (CSS url() in a component <style> is
	 * not rewritten for the base path). Fonts: Lato & Lora, both SIL OFL,
	 * no runtime network calls (privacy, SPEC §6); provenance in ASSETS.md.
	 */
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(html) {
		/* Respect OS font-size accessibility settings. */
		font-size: 100%;
	}

	/*
	 * Design tokens for the warm print-inspired theme, shared with the sibling
	 * forty-fives app: cream paper, terracotta accents, hairline rules,
	 * Lora display + Lato body.
	 *
	 * This is the "Cream" theme of /config (TODO-003) and the default, so it sits on
	 * :root unqualified — it therefore also applies if localStorage is unavailable.
	 * Another theme is a `:global(:root[data-theme='<id>'])` block overriding these
	 * variables, plus an entry in src/lib/ui/theme.ts and in the pre-paint map in
	 * src/app.html; nothing else in the app needs to change.
	 */
	:global(:root) {
		--bg: #f7f2e7;
		--panel: #fffdf6;
		--ink: #3d3a35;
		--muted: #6f6758;
		--accent: #b0503a;
		--accent-deep: #9c4632;
		--rule: #ddd5c4;
		--focus: #9c4632;
		--good: #2c6e3f;
		--bad: #b3261e;
		/* Panel shadow. A token because a warm grey shadow reads as haze on dark paper. */
		--shadow: rgba(61, 58, 53, 0.08);
		--serif: 'Lora', Georgia, 'Times New Roman', serif;
		--sans:
			'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	/*
	 * "Dark" theme (TODO-004): a typical dark theme — near-black paper, light-grey ink, a
	 * friendly blue accent. Palette from the sibling cryptogram project. Colour tokens
	 * only; the fonts are shared.
	 */
	:global(:root[data-theme='dark']) {
		--bg: #121212;
		--panel: #1e1e1e;
		--ink: #e8e8e8;
		--muted: #a0a0a0;
		--accent: #6ea8fe;
		--accent-deep: #4f8ef0;
		--rule: #333333;
		--focus: #8ab4f8;
		--good: #4ade80;
		--bad: #f87171;
		--shadow: rgba(0, 0, 0, 0.5);
	}

	/*
	 * "Tiger" theme (TODO-004): orange and black — near-black warm paper, warm off-white
	 * ink, vivid tiger-orange accents. Palette from cryptogram, where it is called Bengal.
	 */
	:global(:root[data-theme='tiger']) {
		--bg: #1a1206;
		--panel: #241a0d;
		--ink: #ffe9d0;
		--muted: #c9a97f;
		--accent: #f57c1f;
		--accent-deep: #d9631a;
		--rule: #4a3620;
		--focus: #f9a03f;
		--good: #4ade80;
		--bad: #f87171;
		--shadow: rgba(0, 0, 0, 0.5);
	}

	:global(body) {
		margin: 0;
		min-height: 100vh;
		background: var(--bg);
		color: var(--ink);
		font-family: var(--sans);
		line-height: 1.5;
		-webkit-text-size-adjust: 100%;
	}
</style>
