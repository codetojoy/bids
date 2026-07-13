<script lang="ts">
	import type { Card } from '$lib/domain/deck';

	/**
	 * A single card. The Bids deck is suitless, so a card face is just its number: a
	 * large, high-contrast numeral on a paper-coloured rectangle, sized in rem so it
	 * scales with the OS font setting. `tone` shades the face — the prize card carries
	 * the accent, the round's winning bid goes green, losing bids are muted.
	 *
	 * Decorative by itself: the card's value is announced by the surrounding markup
	 * (the hand buttons' labels, the seat rows), so the face is aria-hidden.
	 */
	let {
		value,
		tone = 'plain',
		size = 'md'
	}: { value: Card; tone?: 'plain' | 'prize' | 'winner' | 'muted'; size?: 'sm' | 'md' | 'lg' } =
		$props();
</script>

<span class="card {tone} {size}" aria-hidden="true">{value}</span>

<style>
	.card {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--rule);
		border-radius: 8px;
		background: var(--panel);
		color: var(--ink);
		font-family: var(--serif);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		box-shadow: 0 1px 3px var(--shadow);
	}

	.sm {
		min-width: 2.25rem;
		height: 3rem;
		font-size: 1.25rem;
	}

	.md {
		min-width: 3rem;
		height: 4.25rem;
		font-size: 1.7rem;
	}

	.lg {
		min-width: 5rem;
		height: 7rem;
		font-size: 3rem;
	}

	.prize {
		border: 2px solid var(--accent);
		color: var(--accent-deep);
		background: var(--panel);
	}

	.winner {
		border: 2px solid var(--good);
		color: var(--good);
	}

	.muted {
		color: var(--muted);
		background: var(--bg);
	}
</style>
