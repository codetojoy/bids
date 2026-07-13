import type { Rng } from './rng.ts';

/**
 * The deck is suitless: a card *is* its number (GameRules.md). Every card in a deck is
 * unique, which is what makes bids impossible to tie — see game-state.ts.
 */
export type Card = number;

/** The cards 1..size, in order. */
export function buildDeck(size: number): Card[] {
	if (!Number.isInteger(size) || size < 1) {
		throw new Error(`deck size must be a positive integer, got ${size}`);
	}
	return Array.from({ length: size }, (_, i) => i + 1);
}

/** Fisher–Yates. Returns a new array; the input is untouched. */
export function shuffle(deck: readonly Card[], rng: Rng): Card[] {
	const out = [...deck];
	for (let i = out.length - 1; i > 0; i--) {
		const j = rng.nextInt(i + 1);
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

export interface Deal {
	/** One hand per player, in dealt order — the order the "next card" strategy bids in. */
	hands: Card[][];
	/** The prize pool. One card is turned up per round, in this order. */
	kitty: Card[];
}

/**
 * Deal the deck evenly to `playerCount` players *and* the kitty — so the deck is split
 * into `playerCount + 1` equal piles (GameRules.md). Each player therefore holds exactly
 * as many cards as there are rounds, and the game ends with every hand empty.
 *
 * Throws if the deck doesn't divide evenly, rather than silently dropping cards.
 */
export function deal(deck: readonly Card[], playerCount: number): Deal {
	if (!Number.isInteger(playerCount) || playerCount < 2) {
		throw new Error(`need at least 2 players, got ${playerCount}`);
	}
	const piles = playerCount + 1;
	if (deck.length % piles !== 0) {
		throw new Error(
			`deck of ${deck.length} does not divide evenly among ${playerCount} players + kitty (${piles} piles)`
		);
	}
	const per = deck.length / piles;
	const hands: Card[][] = [];
	for (let p = 0; p < playerCount; p++) {
		hands.push(deck.slice(p * per, (p + 1) * per));
	}
	const kitty = deck.slice(playerCount * per);
	return { hands, kitty };
}
