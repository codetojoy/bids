import { describe, expect, it } from 'vitest';
import { validDeckSizes } from '../../src/lib/domain/deck.ts';
import {
	assignRandomStrategies,
	currentPrize,
	DEFAULT_CONFIG,
	HUMAN_ID,
	playRound,
	startGame,
	type GameConfig,
	type GameState
} from '../../src/lib/domain/game-state.ts';
import { gameWinners } from '../../src/lib/domain/scoring.ts';
import { makeRng } from '../../src/lib/domain/rng.ts';
import { STRATEGY_IDS, type StrategyId } from '../../src/lib/domain/strategy.ts';

const config = (seed: number): GameConfig => ({ ...DEFAULT_CONFIG, seed });

/** The default table, with every computer seat playing the same given strategy. */
const configWith = (strategy: StrategyId, seed: number): GameConfig => ({
	...config(seed),
	players: DEFAULT_CONFIG.players.map((p) => (p.strategy === null ? p : { ...p, strategy }))
});

/** Play a game to the end, the human always bidding the first card in their hand. */
function playOut(state: GameState): GameState {
	let s = state;
	while (s.phase !== 'complete') {
		s = playRound(s, s.hands[HUMAN_ID][0]);
	}
	return s;
}

describe('startGame', () => {
	it('deals the TODO-002 game: 40 cards, four seats of 8, an 8-card kitty', () => {
		const state = startGame(config(1));
		expect(state.players.map((p) => p.name)).toEqual(['You', 'Mozart', 'Brahms', 'Chopin']);
		expect(state.hands.every((h) => h.length === 8)).toBe(true);
		expect(state.kitty).toHaveLength(8);
		expect(state.scores).toEqual([0, 0, 0, 0]);
		expect(state.phase).toBe('bidding');
		expect(state.round).toBe(0);
	});

	it('conserves the deck across hands and kitty', () => {
		const state = startGame(config(2));
		const all = [...state.hands.flat(), ...state.kitty].sort((a, b) => a - b);
		expect(all).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
	});

	it('is deterministic for a seed', () => {
		expect(startGame(config(5))).toEqual(startGame(config(5)));
		expect(startGame(config(5)).hands).not.toEqual(startGame(config(6)).hands);
	});

	it('rejects a human seat with a strategy', () => {
		expect(() =>
			startGame({
				...config(1),
				players: [
					{ name: 'You', strategy: 'nextCard' },
					{ name: 'Mozart', strategy: 'nextCard' }
				]
			})
		).toThrow(/human seat/);
	});

	it('rejects fewer than two players', () => {
		expect(() => startGame({ ...config(1), players: [{ name: 'You', strategy: null }] })).toThrow(
			/at least 2 players/
		);
	});
});

describe('playRound', () => {
	it('awards the prize card’s points to the highest bidder', () => {
		const state = startGame(config(3));
		const prize = currentPrize(state)!;
		const next = playRound(state, state.hands[HUMAN_ID][0]);

		const result = next.history[0];
		expect(result.prize).toBe(prize);
		expect(result.points).toBe(prize);
		expect(result.bids.map((b) => b.card)).toEqual(
			state.players.map((p) => state.hands[p.id][0]) // every seat bids its first card here
		);
		expect(next.scores[result.winnerId]).toBe(prize);
		expect(next.scores.filter((s) => s > 0)).toHaveLength(1);
	});

	it('bids the human’s chosen card, and the computers’ next-in-hand cards', () => {
		const state = startGame(config(4));
		const chosen = state.hands[HUMAN_ID][3];
		const next = playRound(state, chosen);

		expect(next.history[0].bids[HUMAN_ID].card).toBe(chosen);
		for (const p of state.players.slice(1)) {
			expect(next.history[0].bids[p.id].card).toBe(state.hands[p.id][0]);
		}
	});

	it('discards every bid: each hand shrinks by exactly the card it bid', () => {
		const state = startGame(config(5));
		const chosen = state.hands[HUMAN_ID][2];
		const next = playRound(state, chosen);

		expect(next.hands[HUMAN_ID]).not.toContain(chosen);
		for (const p of state.players) {
			expect(next.hands[p.id]).toHaveLength(state.hands[p.id].length - 1);
		}
		expect(next.round).toBe(1);
	});

	it('does not mutate the state it is given', () => {
		const state = startGame(config(6));
		const before = structuredClone(state);
		playRound(state, state.hands[HUMAN_ID][0]);
		expect(state).toEqual(before);
	});

	it('rejects a card the human does not hold', () => {
		const state = startGame(config(7));
		const notHeld = Array.from({ length: 40 }, (_, i) => i + 1).find(
			(c) => !state.hands[HUMAN_ID].includes(c)
		)!;
		expect(() => playRound(state, notHeld)).toThrow(/do not hold/);
	});

	it('rejects a card already bid in an earlier round', () => {
		const state = startGame(config(8));
		const chosen = state.hands[HUMAN_ID][0];
		const next = playRound(state, chosen);
		expect(() => playRound(next, chosen)).toThrow(/do not hold/);
	});

	it('refuses to play past the end of the game', () => {
		const done = playOut(startGame(config(9)));
		expect(done.phase).toBe('complete');
		expect(() => playRound(done, 1)).toThrow(/game is over/);
	});
});

describe('assignRandomStrategies (TODO-006)', () => {
	it('gives every computer seat a distinct strategy and leaves the human seat alone', () => {
		const players = assignRandomStrategies(DEFAULT_CONFIG.players, makeRng(3));

		expect(players.map((p) => p.name)).toEqual(DEFAULT_CONFIG.players.map((p) => p.name));
		expect(players[HUMAN_ID].strategy).toBeNull();

		const strategies = players.slice(1).map((p) => p.strategy);
		expect(new Set(strategies).size).toBe(strategies.length);
		for (const id of strategies) expect(STRATEGY_IDS).toContain(id!);
	});

	it('keeps the game reproducible from its seed: same seed, same opponents', () => {
		expect(assignRandomStrategies(DEFAULT_CONFIG.players, makeRng(11))).toEqual(
			assignRandomStrategies(DEFAULT_CONFIG.players, makeRng(11))
		);
	});

	it('plays out from a randomly-strategied table, conserving points and cards', () => {
		for (let seed = 0; seed < 25; seed++) {
			const start = startGame({
				...config(seed),
				players: assignRandomStrategies(DEFAULT_CONFIG.players, makeRng(seed))
			});
			const done = playOut(start);
			expect(done.scores.reduce((a, b) => a + b, 0)).toBe(start.kitty.reduce((a, b) => a + b, 0));
			expect(done.hands.every((h) => h.length === 0)).toBe(true);
		}
	});
});

describe('a game at every playable deck size (TODO-005)', () => {
	it.each(validDeckSizes(4))('deck of %i: deals, plays out, and conserves everything', (deckSize) => {
		const perPile = deckSize / 5; // four players + the kitty
		const start = startGame({ ...DEFAULT_CONFIG, deckSize, seed: deckSize });

		expect(start.hands.every((h) => h.length === perPile)).toBe(true);
		expect(start.kitty).toHaveLength(perPile);
		// No card outside the chosen deck can appear.
		expect([...start.hands.flat(), ...start.kitty].sort((a, b) => a - b)).toEqual(
			Array.from({ length: deckSize }, (_, i) => i + 1)
		);

		const done = playOut(start);

		expect(done.history).toHaveLength(perPile); // the deck size sets the length of the game
		expect(done.round).toBe(perPile);
		expect(done.hands.every((h) => h.length === 0)).toBe(true);
		expect(done.scores.reduce((a, b) => a + b, 0)).toBe(start.kitty.reduce((a, b) => a + b, 0));
	});

	it('refuses a deck size that cannot be dealt', () => {
		for (const deckSize of [41, 15, 65, 0]) {
			expect(() => startGame({ ...DEFAULT_CONFIG, deckSize, seed: 1 })).toThrow(/not playable/);
		}
	});
});

describe('a full game', () => {
	it('runs exactly as many rounds as there are kitty cards, and empties every hand', () => {
		const done = playOut(startGame(config(10)));
		expect(done.round).toBe(8);
		expect(done.history).toHaveLength(8);
		expect(done.hands.every((h) => h.length === 0)).toBe(true);
		expect(currentPrize(done)).toBeNull();
	});

	/* The books must balance: every point that leaves the kitty lands on a scoreboard. */
	it.each([1, 2, 3, 42, 99, 1234, 65535])(
		'conserves points and cards over a seeded game (seed %i)',
		(seed) => {
			const start = startGame(config(seed));
			const kittyTotal = start.kitty.reduce((a, b) => a + b, 0);
			const done = playOut(start);

			expect(done.scores.reduce((a, b) => a + b, 0)).toBe(kittyTotal);

			// Every card played is a card that was held, and each is bid exactly once.
			const bidCards = done.history.flatMap((r) => r.bids.map((b) => b.card)).sort((a, b) => a - b);
			const dealtCards = start.hands.flat().sort((a, b) => a - b);
			expect(bidCards).toEqual(dealtCards);

			expect(gameWinners(done).length).toBeGreaterThanOrEqual(1);
		}
	);

	/* The invariants must hold whoever is bidding — a strategy is not allowed to make cards
	   or points appear. Every seat plays the same strategy here, which is the harshest case:
	   min against min bids the whole hand in ascending order. */
	it.each(STRATEGY_IDS)('conserves points and cards with every seat playing %s', (strategy) => {
		for (let seed = 0; seed < 20; seed++) {
			const start = startGame(configWith(strategy, seed));
			const done = playOut(start);

			expect(done.history).toHaveLength(start.kitty.length);
			expect(done.hands.every((h) => h.length === 0)).toBe(true);
			expect(done.scores.reduce((a, b) => a + b, 0)).toBe(
				start.kitty.reduce((a, b) => a + b, 0)
			);

			const bidCards = done.history.flatMap((r) => r.bids.map((b) => b.card)).sort((a, b) => a - b);
			expect(bidCards).toEqual(start.hands.flat().sort((a, b) => a - b));
		}
	});

	it('terminates for a hundred seeds, with the human bidding whatever they like', () => {
		for (let seed = 0; seed < 100; seed++) {
			const start = startGame(config(seed));
			let state = start;
			let rounds = 0;
			while (state.phase !== 'complete') {
				// Bid an arbitrary (seed-varying) card from the hand, not just the first.
				const hand = state.hands[HUMAN_ID];
				state = playRound(state, hand[(seed + rounds) % hand.length]);
				rounds++;
				expect(rounds).toBeLessThanOrEqual(8);
			}
			expect(rounds).toBe(8);
			expect(state.scores.reduce((a, b) => a + b, 0)).toBe(
				start.kitty.reduce((a, b) => a + b, 0)
			);
		}
	});
});
