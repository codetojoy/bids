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
	 * :root unqualified — it therefore also applies before the saved theme is read, and
	 * if localStorage is unavailable. A second theme is added as a
	 * `:global(:root[data-theme='<id>'])` block overriding these variables, plus an entry
	 * in src/lib/ui/theme.ts; nothing else in the app needs to change.
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
		--serif: 'Lora', Georgia, 'Times New Roman', serif;
		--sans:
			'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
