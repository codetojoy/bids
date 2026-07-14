<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { validDeckSizes } from '$lib/domain/deck';
	import { DEFAULT_CONFIG } from '$lib/domain/game-state';
	import {
		applyTheme,
		defaultSettings,
		loadSettings,
		parseDeckSize,
		saveSettings,
		type Settings
	} from '$lib/ui/settings';
	import { THEMES, parseThemeId } from '$lib/ui/theme';

	const playerCount = DEFAULT_CONFIG.players.length;
	const deckSizes = validDeckSizes(playerCount);
	// Every pile is the same size: one per player, plus the kitty. So the cards each player
	// holds — and therefore the number of rounds — is the deck split that many ways.
	const roundsFor = (deckSize: number) => deckSize / (playerCount + 1);

	// The saved values are only readable in the browser (localStorage), and the page is
	// prerendered — so start from the defaults and load the real ones on mount.
	let settings = $state<Settings>(defaultSettings());
	let saved = $state(false);

	onMount(() => {
		settings = loadSettings();
	});

	function commit(next: Settings) {
		settings = next;
		saveSettings(next);
		saved = true;
	}

	function chooseTheme(event: Event) {
		const themeId = parseThemeId((event.currentTarget as HTMLSelectElement).value);
		commit({ ...settings, themeId });
		applyTheme(themeId);
	}

	function chooseDeckSize(event: Event) {
		const deckSize = parseDeckSize(Number((event.currentTarget as HTMLSelectElement).value));
		commit({ ...settings, deckSize });
	}

	function chooseShowStrategy(event: Event) {
		commit({ ...settings, showStrategy: (event.currentTarget as HTMLInputElement).checked });
	}
</script>

<svelte:head>
	<title>Config — Bids</title>
	<meta name="description" content="Configure Bids: choose a theme and a deck size." />
</svelte:head>

<main>
	<header>
		<h1>Config</h1>
		<p class="subtitle">Set up the game</p>
	</header>

	<section class="settings">
		<div class="setting">
			<label for="theme">Theme</label>
			<select id="theme" value={settings.themeId} onchange={chooseTheme}>
				{#each THEMES as theme (theme.id)}
					<option value={theme.id}>{theme.label}</option>
				{/each}
			</select>
			<p class="hint">The look of the app.</p>
		</div>

		<div class="setting">
			<label for="deck-size">Deck size</label>
			<select id="deck-size" value={settings.deckSize} onchange={chooseDeckSize}>
				{#each deckSizes as size (size)}
					<option value={size}>{size} cards — {roundsFor(size)} each, {roundsFor(size)} rounds</option>
				{/each}
			</select>
			<p class="hint">
				The deck is dealt out evenly to the {playerCount} players and the kitty, so a bigger deck
				means a longer game. Takes effect on your next new game.
			</p>
		</div>

		<div class="setting">
			<span class="label">Display strategy</span>
			<label class="check">
				<input
					type="checkbox"
					checked={settings.showStrategy}
					onchange={chooseShowStrategy}
				/>
				<span>Show each computer player's strategy while you play</span>
			</label>
			<p class="hint">
				Names it beside the player — “Mozart (Min)”, “Chopin (Nearest)” — so you can see how each
				opponent is bidding. Takes effect on your next new game.
			</p>
		</div>

		<p class="saved" aria-live="polite">
			{#if saved}
				Saved. Your settings stay on this device.
			{/if}
		</p>
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
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
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

	label:not(.check),
	.label {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent-deep);
	}

	/* The whole row is the tap target, not just the box — comfortably past 48px. */
	.check {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 48px;
		padding: 0 0.75rem;
		border: 1px solid var(--rule);
		border-radius: 8px;
		background: var(--bg);
		color: var(--ink);
		font-size: 1.05rem;
		cursor: pointer;
	}

	.check input {
		width: 1.5rem;
		height: 1.5rem;
		accent-color: var(--accent);
		cursor: pointer;
	}

	.check:focus-within {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
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

	.saved {
		margin: 0;
		min-height: 1.5rem;
		color: var(--good);
		font-weight: 700;
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
