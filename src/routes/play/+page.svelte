<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import type { Card } from '$lib/domain/deck';
	import {
		assignStrategies,
		currentPrize,
		DEFAULT_CONFIG,
		HUMAN_ID,
		playRound,
		startGame,
		type GameState,
		type Player,
		type RoundResult
	} from '$lib/domain/game-state';
	import { gameWinners, standings } from '$lib/domain/scoring';
	import { makeRng, randomSeed } from '$lib/domain/rng';
	import { STRATEGY_LABELS } from '$lib/domain/strategy';
	import { loadSettings } from '$lib/ui/settings';
	import NumberCard from '$lib/ui/NumberCard.svelte';
	import peepYou from '$lib/assets/avatars/peep-04.svg';
	import peepMozart from '$lib/assets/avatars/peep-02.svg';
	import peepBrahms from '$lib/assets/avatars/peep-01.svg';
	import peepChopin from '$lib/assets/avatars/peep-16.svg';

	// Avatars are decorative (ASSETS.md): the seat name is the real identifier.
	const avatars = [peepYou, peepMozart, peepBrahms, peepChopin];

	// The settings come from /config, read at deal time — so a change starts applying with the
	// next new game, and a game in progress keeps the deck and the opponents it was dealt.
	// The opponents are the seats configured on /config (TODO-007): each plays the strategy it
	// was given, and an Auto seat is dealt one from the game's own seed, so the whole table is
	// still reproducible from that seed.
	function newGame() {
		const settings = loadSettings();
		const seed = randomSeed();
		showStrategy = settings.showStrategy;
		const seats = [DEFAULT_CONFIG.players[HUMAN_ID], ...settings.players];
		return startGame({
			deckSize: settings.deckSize,
			players: assignStrategies(seats, makeRng(seed)),
			seed
		});
	}

	// The deal is random, so it must happen in the browser, not at prerender time: a game
	// dealt during the static build would be baked into the HTML and then contradicted by
	// the one the client deals on hydration. null means "not dealt yet" (SSR + first frame).
	let game = $state<GameState | null>(null);
	let showStrategy = $state(false);
	// The round just played, held on screen so the bids can be read before moving on.
	// null means "waiting for your bid".
	let revealed = $state<RoundResult | null>(null);

	onMount(() => {
		game = newGame();
	});

	const prize = $derived(game ? currentPrize(game) : null);
	const hand = $derived(game ? [...game.hands[HUMAN_ID]].sort((a, b) => a - b) : []);
	const table = $derived(game ? standings(game) : []);
	const winners = $derived(game?.phase === 'complete' ? gameWinners(game) : []);
	const totalRounds = $derived(game?.kitty.length ?? 0);

	function bid(card: Card) {
		if (!game) return;
		game = playRound(game, card);
		revealed = game.history[game.history.length - 1];
	}

	function nextRound() {
		revealed = null;
	}

	function restart() {
		game = newGame();
		revealed = null;
	}

	const bidOf = (result: RoundResult, playerId: number) =>
		result.bids.find((b) => b.playerId === playerId)!.card;

	// "Mozart (Min)" when the setting is on. The human seat has no strategy, so it stays "You".
	const seatName = (player: Player) =>
		showStrategy && player.strategy
			? `${player.name} (${STRATEGY_LABELS[player.strategy]})`
			: player.name;
</script>

<svelte:head>
	<title>Play — Bids</title>
	<meta name="description" content="Play a game of Bids against Mozart, Brahms and Chopin." />
</svelte:head>

<main>
	<header>
		<h1>Bids</h1>
		<p class="subtitle">
			{#if !game}
				Dealing…
			{:else if revealed}
				<!-- The state has already advanced, so name the round being *shown*, not the next one. -->
				Round {revealed.round + 1} of {totalRounds}
			{:else if game.phase === 'complete'}
				Game over
			{:else}
				Round {game.round + 1} of {totalRounds}
			{/if}
		</p>
	</header>

	{#if game}
		<!-- Scoreboard: one row per seat, showing the bid it made once the round is revealed. -->
		<ol class="seats">
			{#each game.players as player (player.id)}
				<li class="seat" class:won={revealed?.winnerId === player.id}>
					<img class="avatar" src={avatars[player.id]} alt="" aria-hidden="true" />
					<span class="name">{seatName(player)}</span>
					<span class="bid">
						{#if revealed}
							<NumberCard
								value={bidOf(revealed, player.id)}
								size="sm"
								tone={revealed.winnerId === player.id ? 'winner' : 'muted'}
							/>
							<span class="visually-hidden">
								bid {bidOf(revealed, player.id)}{revealed.winnerId === player.id
									? `, won ${revealed.points} points`
									: ''}
							</span>
						{/if}
					</span>
					<span class="score">{game.scores[player.id]}<span class="pts">pts</span></span>
				</li>
			{/each}
		</ol>

		<!-- The reveal comes first even when that round ended the game, so the deciding bids
		     are seen before the final standings replace them. -->
		{#if revealed}
			<section class="prize-card">
				<h2>Prize card</h2>
				<NumberCard value={revealed.prize} tone="prize" size="lg" />
				<p class="worth">worth {revealed.points} points</p>
			</section>

			<section class="reveal" aria-live="polite">
				<p>
					{#if revealed.winnerId === HUMAN_ID}
						Your bid of {bidOf(revealed, HUMAN_ID)} is highest — you take {revealed.points} points.
					{:else}
						{game.players[revealed.winnerId].name} bids {bidOf(revealed, revealed.winnerId)} and takes
						{revealed.points} points.
					{/if}
				</p>
				<button class="primary" onclick={nextRound}>
					{game.phase === 'complete' ? 'See the result' : 'Next round'}
				</button>
			</section>
		{:else if game.phase === 'complete'}
			<section class="result" aria-live="polite">
				<h2>
					{#if winners.length > 1}
						A tie: {winners.map((w) => w.name).join(' and ')} — {winners[0].score} points
					{:else if winners[0].playerId === HUMAN_ID}
						You win with {winners[0].score} points
					{:else}
						{winners[0].name} wins with {winners[0].score} points
					{/if}
				</h2>
				<ol class="final">
					{#each table as row (row.playerId)}
						<li><span>{row.name}</span><span>{row.score}</span></li>
					{/each}
				</ol>
				<button class="primary" onclick={restart}>New game</button>
			</section>
		{:else}
			<section class="prize-card" aria-live="polite">
				<h2>Prize card</h2>
				<NumberCard value={prize!} tone="prize" size="lg" />
				<p class="worth">worth {prize} points</p>
			</section>

			<section class="hand">
				<h2 id="hand-label">Your hand — bid one card</h2>
				<ul class="cards" aria-labelledby="hand-label">
					{#each hand as card (card)}
						<li>
							<button class="card-button" onclick={() => bid(card)}>
								<NumberCard value={card} />
								<span class="visually-hidden">Bid {card}</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}

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
		margin-bottom: 1.5rem;
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

	h2 {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent-deep);
		margin: 0 0 0.75rem;
	}

	.seats {
		list-style: none;
		margin: 0 0 1.5rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.seat {
		display: grid;
		grid-template-columns: 2.5rem 1fr auto auto;
		align-items: center;
		gap: 0.75rem;
		min-height: 56px;
		padding: 0.5rem 0.9rem;
		border: 1px solid var(--rule);
		border-left: 4px solid var(--rule);
		border-radius: 6px;
		background: var(--panel);
	}

	.seat.won {
		border-left-color: var(--good);
	}

	.avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: var(--bg);
	}

	.name {
		font-weight: 700;
	}

	.bid {
		display: inline-flex;
		align-items: center;
		min-width: 2.25rem;
	}

	.score {
		font-family: var(--serif);
		font-size: 1.4rem;
		font-variant-numeric: tabular-nums;
		color: var(--accent-deep);
	}

	.pts {
		font-family: var(--sans);
		font-size: 0.8rem;
		color: var(--muted);
		margin-left: 0.25rem;
	}

	.prize-card,
	.reveal,
	.hand,
	.result {
		padding: 1.25rem;
		border: 1px solid var(--rule);
		border-left: 4px solid var(--accent);
		border-radius: 6px;
		background: var(--panel);
		box-shadow: 0 1px 3px var(--shadow);
	}

	.prize-card {
		text-align: center;
		margin-bottom: 1rem;
	}

	.worth {
		margin: 0.75rem 0 0;
		color: var(--muted);
		font-style: italic;
	}

	.reveal p {
		margin: 0 0 1rem;
		font-size: 1.1rem;
	}

	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/* The tap target is the button, not the card face — kept well past 48px on both axes. */
	.card-button {
		display: block;
		padding: 0.25rem;
		border: none;
		border-radius: 10px;
		background: none;
		cursor: pointer;
	}

	.card-button:hover :global(.card),
	.card-button:focus-visible :global(.card) {
		border-color: var(--accent);
		color: var(--accent-deep);
	}

	.card-button:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}

	.primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		padding: 0 1.5rem;
		border: none;
		border-radius: 8px;
		background: var(--accent);
		color: var(--panel);
		font-family: var(--sans);
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		cursor: pointer;
	}

	.primary:hover {
		background: var(--accent-deep);
	}

	.primary:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}

	.result {
		text-align: center;
	}

	.result h2 {
		font-family: var(--serif);
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: normal;
		text-transform: none;
		color: var(--accent);
	}

	.final {
		list-style: none;
		margin: 0 0 1.25rem;
		padding: 0;
		text-align: left;
	}

	.final li {
		display: flex;
		justify-content: space-between;
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--rule);
		font-variant-numeric: tabular-nums;
	}

	.note {
		margin-top: 1.5rem;
		text-align: center;
	}

	.note a {
		color: var(--accent);
		font-weight: 600;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
