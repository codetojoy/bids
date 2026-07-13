<script lang="ts">
	import { base } from '$app/paths';

	// Shared shell for routes that exist but aren't built yet (TODO-001 scaffolding).
	// Delete this component once /play and /config are real pages.
	let { title, subtitle, children }: { title: string; subtitle: string; children?: import('svelte').Snippet } =
		$props();
</script>

<main>
	<header>
		<h1>{title}</h1>
		<p class="subtitle">{subtitle}</p>
	</header>

	<section class="placeholder">
		{#if children}
			{@render children()}
		{/if}
		<p class="soon">Coming soon.</p>
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

	.placeholder {
		padding: 1.5rem;
		border: 1px solid var(--rule);
		border-left: 4px solid var(--accent);
		border-radius: 6px;
		background: var(--panel);
		box-shadow: 0 1px 3px rgba(61, 58, 53, 0.08);
		font-size: 1.05rem;
	}

	.soon {
		margin: 1rem 0 0;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: 0.95rem;
		color: var(--accent-deep);
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
