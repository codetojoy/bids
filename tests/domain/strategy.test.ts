import { describe, expect, it } from 'vitest';
import { makeRng } from '../../src/lib/domain/rng.ts';
import {
	AUTO,
	getStrategy,
	isStrategyChoice,
	isStrategyId,
	randomStrategies,
	STRATEGY_IDS,
	STRATEGY_LABELS
} from '../../src/lib/domain/strategy.ts';

const DECK = 40;

describe('nextCard strategy', () => {
	const nextCard = getStrategy('nextCard');

	it('bids the next card in the hand as dealt — not the lowest, not the nearest', () => {
		expect(nextCard({ hand: [9, 2, 7], prize: 8, deckSize: DECK })).toBe(9);
		expect(nextCard({ hand: [2, 9, 7], prize: 8, deckSize: DECK })).toBe(2);
	});

	it('ignores the prize card entirely', () => {
		const hand = [4, 1, 6];
		for (const prize of [1, 20, 40]) {
			expect(nextCard({ hand, prize, deckSize: DECK })).toBe(4);
		}
	});
});

describe('min strategy', () => {
	const min = getStrategy('min');

	it('bids the lowest card held, wherever it sits in the hand', () => {
		expect(min({ hand: [9, 2, 7], prize: 8, deckSize: DECK })).toBe(2);
		expect(min({ hand: [2, 9, 7], prize: 8, deckSize: DECK })).toBe(2);
		expect(min({ hand: [9, 7, 2], prize: 8, deckSize: DECK })).toBe(2);
	});

	it('ignores the prize card', () => {
		for (const prize of [1, 20, 40]) {
			expect(min({ hand: [30, 5, 18], prize, deckSize: DECK })).toBe(5);
		}
	});
});

describe('max strategy', () => {
	const max = getStrategy('max');

	it('bids the highest card held, wherever it sits in the hand', () => {
		expect(max({ hand: [9, 2, 7], prize: 8, deckSize: DECK })).toBe(9);
		expect(max({ hand: [2, 7, 9], prize: 8, deckSize: DECK })).toBe(9);
	});

	it('ignores the prize card', () => {
		for (const prize of [1, 20, 40]) {
			expect(max({ hand: [30, 5, 18], prize, deckSize: DECK })).toBe(30);
		}
	});
});

describe('nearest strategy', () => {
	const nearest = getStrategy('nearest');

	it('bids the card closest to the prize in face value, from either side', () => {
		expect(nearest({ hand: [3, 19, 38], prize: 20, deckSize: DECK })).toBe(19); // just below
		expect(nearest({ hand: [3, 21, 38], prize: 20, deckSize: DECK })).toBe(21); // just above
		expect(nearest({ hand: [3, 19, 38], prize: 39, deckSize: DECK })).toBe(38);
		expect(nearest({ hand: [3, 19, 38], prize: 1, deckSize: DECK })).toBe(3);
	});

	it('breaks an equal distance toward the lower card — the cheaper card, same chance', () => {
		expect(nearest({ hand: [17, 23], prize: 20, deckSize: DECK })).toBe(17);
		expect(nearest({ hand: [23, 17], prize: 20, deckSize: DECK })).toBe(17); // order-independent
	});

	it('bids its only card when that is all it has', () => {
		expect(nearest({ hand: [40], prize: 1, deckSize: DECK })).toBe(40);
	});
});

describe('hybrid strategy', () => {
	const hybrid = getStrategy('hybrid');
	const hand = [4, 17, 23, 39];

	it('plays nearest when the prize is in the top half of the deck', () => {
		expect(hybrid({ hand, prize: 21, deckSize: 40 })).toBe(23);
		expect(hybrid({ hand, prize: 40, deckSize: 40 })).toBe(39);
	});

	it('plays min when the prize is in the bottom half', () => {
		expect(hybrid({ hand, prize: 19, deckSize: 40 })).toBe(4);
		expect(hybrid({ hand, prize: 1, deckSize: 40 })).toBe(4);
	});

	it('treats exactly half the deck as *not* a big prize (the test is prize > N / 2)', () => {
		expect(hybrid({ hand, prize: 20, deckSize: 40 })).toBe(4); // min
		expect(hybrid({ hand, prize: 21, deckSize: 40 })).toBe(23); // nearest
	});

	it('moves its threshold with the deck size', () => {
		// A prize of 21 is a big prize in a 40-card deck and a small one in a 60-card deck.
		expect(hybrid({ hand, prize: 21, deckSize: 40 })).toBe(23); // nearest
		expect(hybrid({ hand, prize: 21, deckSize: 60 })).toBe(4); // min
	});
});

describe('every strategy', () => {
	it.each(STRATEGY_IDS)('%s bids a card the player actually holds', (id) => {
		const strategy = getStrategy(id);
		const hand = [12, 3, 30, 27, 8];
		for (let prize = 1; prize <= DECK; prize++) {
			expect(hand).toContain(strategy({ hand, prize, deckSize: DECK }));
		}
	});

	it.each(STRATEGY_IDS)('%s is pure: it does not touch the hand it is given', (id) => {
		const hand = [12, 3, 30];
		getStrategy(id)({ hand, prize: 20, deckSize: DECK });
		expect(hand).toEqual([12, 3, 30]);
	});

	it('has a label for each id, and an id for each label', () => {
		expect(Object.keys(STRATEGY_LABELS).sort()).toEqual([...STRATEGY_IDS].sort());
	});
});

describe('getStrategy', () => {
	it('throws on an unknown id', () => {
		// @ts-expect-error — deliberately outside StrategyId
		expect(() => getStrategy('telepathy')).toThrow(/unknown strategy/);
	});
});

describe('randomStrategies', () => {
	it('picks distinct strategies', () => {
		for (let seed = 0; seed < 50; seed++) {
			const picked = randomStrategies(3, makeRng(seed));
			expect(picked).toHaveLength(3);
			expect(new Set(picked).size).toBe(3);
			for (const id of picked) expect(STRATEGY_IDS).toContain(id);
		}
	});

	it('is deterministic for a seed — the same seed deals the same opponents', () => {
		expect(randomStrategies(3, makeRng(7))).toEqual(randomStrategies(3, makeRng(7)));
	});

	it('does not always deal the same three', () => {
		const seen = new Set<string>();
		for (let seed = 0; seed < 50; seed++) {
			seen.add(randomStrategies(3, makeRng(seed)).join(','));
		}
		expect(seen.size).toBeGreaterThan(1);
	});

	it('can deal every strategy at once, and none at all', () => {
		const all = randomStrategies(STRATEGY_IDS.length, makeRng(1));
		expect([...all].sort()).toEqual([...STRATEGY_IDS].sort());
		expect(randomStrategies(0, makeRng(1))).toEqual([]);
	});

	it('refuses to pick more distinct strategies than exist', () => {
		expect(() => randomStrategies(STRATEGY_IDS.length + 1, makeRng(1))).toThrow(/distinct/);
	});

	/* TODO-007: an Auto seat draws from what the hand-picked seats left behind. */
	it('never picks an excluded strategy', () => {
		for (let seed = 0; seed < 40; seed++) {
			const picked = randomStrategies(2, makeRng(seed), ['min', 'max']);
			expect(picked).not.toContain('min');
			expect(picked).not.toContain('max');
			expect(new Set(picked).size).toBe(2);
		}
	});

	it('counts the exclusions against what is left to pick from', () => {
		expect(() => randomStrategies(3, makeRng(1), ['min', 'max', 'nearest'])).toThrow(/distinct/);
	});
});

describe('the strategy choices a seat can be configured with (TODO-007)', () => {
	it('recognizes every strategy id, and Auto, and nothing else', () => {
		for (const id of STRATEGY_IDS) {
			expect(isStrategyId(id)).toBe(true);
			expect(isStrategyChoice(id)).toBe(true);
		}
		expect(isStrategyChoice(AUTO)).toBe(true);
		// Auto is a *setting*, not a strategy: nothing can bid it.
		expect(isStrategyId(AUTO)).toBe(false);
		for (const bad of ['telepathy', '', null, undefined, 7, {}]) {
			expect(isStrategyChoice(bad)).toBe(false);
			expect(isStrategyId(bad)).toBe(false);
		}
	});
});
