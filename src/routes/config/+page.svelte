<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { applyTheme, loadSettings, saveSettings } from '$lib/ui/settings';
	import { DEFAULT_THEME_ID, THEMES, parseThemeId, type ThemeId } from '$lib/ui/theme';

	// The saved value is only readable in the browser (localStorage), and the page is
	// prerendered — so start from the default and load the real value on mount.
	let themeId = $state<ThemeId>(DEFAULT_THEME_ID);
	let saved = $state(false);

	onMount(() => {
		themeId = loadSettings().themeId;
	});

	function chooseTheme(event: Event) {
		themeId = parseThemeId((event.currentTarget as HTMLSelectElement).value);
		saveSettings({ themeId });
		applyTheme(themeId);
		saved = true;
	}
</script>

<svelte:head>
	<title>Config — Bids</title>
	<meta name="description" content="Configure Bids: choose a theme." />
</svelte:head>

<main>
	<header>
		<h1>Config</h1>
		<p class="subtitle">Set up the game</p>
	</header>

	<section class="settings">
		<div class="setting">
			<label for="theme">Theme</label>
			<select id="theme" value={themeId} onchange={chooseTheme}>
				{#each THEMES as theme (theme.id)}
					<option value={theme.id}>{theme.label}</option>
				{/each}
			</select>
			<p class="hint" aria-live="polite">
				{#if saved}
					Saved. Your settings stay on this device.
				{:else}
					The look of the app.
				{/if}
			</p>
		</div>
	</section>

	<p class="note"><a href="{base}/">← Home</a></p>
</main>

<style>
	main {
		max-width: 40rem;
		margin: 0 auto;
		padding: 2rem 1rem 3rem;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1.25rem;
		border-bottom: 2px solid var(--accent);
	}

	h1 {
		font-family: var(--serif);
		font-weight: 600;
		font-size: 2.6rem;
		margin: 0;
		color: var(--accent);
	}

	.subtitle {
		margin: 0.4rem 0 0;
		font-family: var(--serif);
		font-style: italic;
		font-size: 1.15rem;
		color: var(--muted);
	}

	.settings {
		padding: 1.25rem;
		border: 1px solid var(--rule);
		border-left: 4px solid var(--accent);
		border-radius: 6px;
		background: var(--panel);
		box-shadow: 0 1px 3px var(--shadow);
	}

	.setting {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent-deep);
	}

	/* ≥48px tap target, and large enough text to read at OS scaling. */
	select {
		min-height: 48px;
		padding: 0 0.75rem;
		border: 1px solid var(--rule);
		border-radius: 8px;
		background: var(--bg);
		color: var(--ink);
		font-family: var(--sans);
		font-size: 1.05rem;
		cursor: pointer;
	}

	select:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}

	.hint {
		margin: 0;
		color: var(--muted);
		font-size: 1rem;
	}

	.note {
		margin-top: 1.5rem;
		text-align: center;
	}

	.note a {
		color: var(--accent);
		font-weight: 600;
	}
</style>
