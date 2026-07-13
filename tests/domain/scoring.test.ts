import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, startGame, type GameState } from '../../src/lib/domain/game-state.ts';
import { gameWinners, prizeValue, resolveRound, standings } from '../../src/lib/domain/scoring.ts';

describe('resolveRound', () => {
	it('the highest bid wins', () => {
		const bids = [
			{ playerId: 0, card: 4 },
			{ playerId: 1, card: 31 },
			{ playerId: 2, card: 7 },
			{ playerId: 3, card: 12 }
		];
		expect(resolveRound(bids)).toBe(1);
	});

	it('wins from any seat, including the last', () => {
		expect(
			resolveRound([
				{ playerId: 0, card: 2 },
				{ playerId: 1, card: 3 },
				{ playerId: 2, card: 40 }
			])
		).toBe(2);
	});

	/*
	 * The load-bearing invariant: the deck is suitless and every card unique, so two
	 * players can never bid the same number and no tie-break rule is needed. A duplicate
	 * bid means the deal or a strategy is broken — it must be loud, not quietly resolved.
	 */
	it('throws on a duplicate bid rather than inventing a tie-break', () => {
		expect(() =>
			resolveRound([
				{ playerId: 0, card: 9 },
				{ playerId: 1, card: 9 }
			])
		).toThrow(/duplicate bid/);
	});

	it('throws when there are no bids', () => {
		expect(() => resolveRound([])).toThrow(/no bids/);
	});
});

describe('prizeValue', () => {
	it('is the prize card’s face value', () => {
		expect(prizeValue(1)).toBe(1);
		expect(prizeValue(37)).toBe(37);
	});
});

describe('standings and gameWinners', () => {
	const withScores = (scores: number[]): GameState => ({
		...startGame({ ...DEFAULT_CONFIG, seed: 1 }),
		scores
	});

	it('ranks by score, highest first', () => {
		const table = standings(withScores([30, 12, 90, 45]));
		expect(table.map((s) => s.playerId)).toEqual([2, 3, 0, 1]);
		expect(table[0].name).toBe('Brahms'); // seat 2: You, Mozart, Brahms, Chopin
		expect(table[0].score).toBe(90);
	});

	it('names a single winner outright', () => {
		expect(gameWinners(withScores([10, 20, 5, 1])).map((s) => s.playerId)).toEqual([1]);
	});

	/* Unlike bids, *scores* can tie — two players can each take prizes summing to the same
	   total — so the game can end in a shared win. */
	it('reports every player tied at the top as a shared win', () => {
		expect(gameWinners(withScores([25, 25, 5, 1])).map((s) => s.playerId)).toEqual([0, 1]);
	});
});
