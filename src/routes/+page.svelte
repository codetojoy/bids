<script lang="ts">
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Bids</title>
	<meta
		name="description"
		content="Bids — a simple bidding card game. Free, open source, works offline."
	/>
</svelte:head>

<main>
	<header>
		<h1>Bids</h1>
		<p class="subtitle">A simple bidding game</p>
	</header>

	<nav class="modes" aria-label="Choose a mode">
		<a class="mode" href="{base}/play">
			<span class="mode-icon" aria-hidden="true">🂠</span>
			<span class="mode-text">
				<span class="mode-title">Play</span>
				<span class="mode-desc">
					Bid a card from your hand each round and win the prize cards.
				</span>
			</span>
		</a>
		<a class="mode" href="{base}/config">
			<span class="mode-icon" aria-hidden="true">⚙️</span>
			<span class="mode-text">
				<span class="mode-title">Config</span>
				<span class="mode-desc">
					Deck size, number of players, and the strategies they play with.
				</span>
			</span>
		</a>
	</nav>

	<nav class="site-footer" aria-label="More">
		<a class="about-link" href="{base}/about">About</a>
	</nav>
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

	.modes {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Big, obvious tap targets. */
	.mode {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-height: 72px;
		padding: 1rem 1.25rem;
		border: 1px solid var(--rule);
		border-left: 4px solid var(--accent);
		border-radius: 6px;
		background: var(--panel);
		color: var(--ink);
		text-decoration: none;
		box-shadow: 0 1px 3px var(--shadow);
	}

	.mode:hover {
		border-color: var(--accent);
	}

	.mode:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}

	.mode-icon {
		font-size: 2.4rem;
		line-height: 1;
		color: var(--accent);
	}

	.mode-text {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.mode-title {
		font-size: 1.1rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent-deep);
	}

	.mode-desc {
		font-size: 1.02rem;
		line-height: 1.4;
	}

	/* About is a meta page, not a game mode, so it sits below a divider as a
	   lighter 48px tap target. */
	.site-footer {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--rule);
	}

	.about-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		padding: 0 1rem;
		color: var(--accent-deep);
		font-weight: 700;
		text-decoration: none;
	}

	.about-link:hover,
	.about-link:focus-visible {
		text-decoration: underline;
	}

	.about-link:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
		border-radius: 8px;
	}
</style>
