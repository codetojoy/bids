import { describe, expect, it } from 'vitest';
import { getStrategy } from '../../src/lib/domain/strategy.ts';

describe('nextCard strategy', () => {
	const nextCard = getStrategy('nextCard');

	it('bids the next card in the hand as dealt — not the lowest, not the nearest', () => {
		expect(nextCard({ hand: [9, 2, 7], prize: 8 })).toBe(9);
		expect(nextCard({ hand: [2, 9, 7], prize: 8 })).toBe(2);
	});

	it('ignores the prize card entirely', () => {
		const hand = [4, 1, 6];
		for (const prize of [1, 20, 40]) {
			expect(nextCard({ hand, prize })).toBe(4);
		}
	});

	it('always bids a card the player actually holds', () => {
		const hand = [12, 3, 30];
		expect(hand).toContain(nextCard({ hand, prize: 5 }));
	});
});

describe('getStrategy', () => {
	it('throws on an unknown id', () => {
		// @ts-expect-error — deliberately outside StrategyId
		expect(() => getStrategy('telepathy')).toThrow(/unknown strategy/);
	});
});
