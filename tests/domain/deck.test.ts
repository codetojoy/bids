import { describe, expect, it } from 'vitest';
import { buildDeck, deal, shuffle } from '../../src/lib/domain/deck.ts';
import { makeRng } from '../../src/lib/domain/rng.ts';

describe('buildDeck', () => {
	it('is the numbers 1..n, in order', () => {
		expect(buildDeck(5)).toEqual([1, 2, 3, 4, 5]);
	});

	it('rejects a non-positive or fractional size', () => {
		expect(() => buildDeck(0)).toThrow(/positive integer/);
		expect(() => buildDeck(-3)).toThrow(/positive integer/);
		expect(() => buildDeck(2.5)).toThrow(/positive integer/);
	});
});

describe('shuffle', () => {
	it('is a permutation — every card survives, exactly once', () => {
		const deck = buildDeck(40);
		const shuffled = shuffle(deck, makeRng(1));
		expect([...shuffled].sort((a, b) => a - b)).toEqual(deck);
	});

	it('does not mutate its input', () => {
		const deck = buildDeck(40);
		shuffle(deck, makeRng(2));
		expect(deck).toEqual(buildDeck(40));
	});

	it('is deterministic for a given seed, and differs across seeds', () => {
		const deck = buildDeck(40);
		expect(shuffle(deck, makeRng(7))).toEqual(shuffle(deck, makeRng(7)));
		expect(shuffle(deck, makeRng(7))).not.toEqual(shuffle(deck, makeRng(8)));
	});

	it('actually moves cards around', () => {
		expect(shuffle(buildDeck(40), makeRng(3))).not.toEqual(buildDeck(40));
	});
});

describe('deal', () => {
	it('splits the deck into playerCount + 1 equal piles — one per player, plus the kitty', () => {
		const { hands, kitty } = deal(buildDeck(40), 4);
		expect(hands).toHaveLength(4);
		for (const hand of hands) expect(hand).toHaveLength(8);
		expect(kitty).toHaveLength(8);
	});

	it('conserves the deck: every card lands somewhere, exactly once', () => {
		const deck = shuffle(buildDeck(40), makeRng(11));
		const { hands, kitty } = deal(deck, 4);
		const all = [...hands.flat(), ...kitty].sort((a, b) => a - b);
		expect(all).toEqual(buildDeck(40));
	});

	it('gives every player exactly as many cards as there are rounds', () => {
		const { hands, kitty } = deal(buildDeck(40), 4);
		for (const hand of hands) expect(hand).toHaveLength(kitty.length);
	});

	it('preserves dealt order within a hand (the "next card" strategy depends on it)', () => {
		const { hands, kitty } = deal(buildDeck(9), 2);
		expect(hands[0]).toEqual([1, 2, 3]);
		expect(hands[1]).toEqual([4, 5, 6]);
		expect(kitty).toEqual([7, 8, 9]);
	});

	it('rejects a deck that does not divide evenly, rather than dropping cards', () => {
		// 5 players + kitty = 6 piles; 40 is not a multiple of 6.
		expect(() => deal(buildDeck(40), 5)).toThrow(/does not divide evenly/);
		expect(() => deal(buildDeck(41), 4)).toThrow(/does not divide evenly/);
	});

	it('accepts any player count the deck divides among (3 players + kitty = 4 piles of 10)', () => {
		const { hands, kitty } = deal(buildDeck(40), 3);
		expect(hands.map((h) => h.length)).toEqual([10, 10, 10]);
		expect(kitty).toHaveLength(10);
	});

	it('rejects fewer than two players', () => {
		expect(() => deal(buildDeck(40), 1)).toThrow(/at least 2 players/);
	});
});
