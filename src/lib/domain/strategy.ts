import type { Card } from './deck.ts';
import type { Rng } from './rng.ts';

/**
 * How a computer player picks the card it bids (SPEC §4, strategy pattern).
 *
 * A strategy is a pure function of the information a player legitimately has when
 * bidding: their own hand, the prize card on offer, and the size of the deck (which is
 * public — it is a setting on /config). Bids are simultaneous, so a strategy never sees
 * what anyone else holds or bids. That is a property of the *type*, not of good manners:
 * a strategy is never handed `GameState`, so it cannot cheat however it is written.
 * Keep it that way (see doc/BRAINSTORM-custom-strategies.md §4).
 */
export interface BiddingContext {
	/** The player's remaining cards, in dealt order. Never empty when a bid is asked for. */
	readonly hand: readonly Card[];
	/** The card whose points are on offer this round. */
	readonly prize: Card;
	/** The size of the deck this game is played with — the highest card that exists. */
	readonly deckSize: number;
}

export type Strategy = (context: BiddingContext) => Card;

export type StrategyId = 'nextCard' | 'min' | 'max' | 'nearest' | 'hybrid';

/** Bid the next card in the hand as dealt — the simplest possible opponent (TODO-002). */
const nextCard: Strategy = ({ hand }) => hand[0];

/** Bid the lowest card held: hold the big cards back for the big prizes. */
const min: Strategy = ({ hand }) => hand.reduce((lowest, card) => (card < lowest ? card : lowest));

/** Bid the highest card held: take this prize, whatever it costs later. */
const max: Strategy = ({ hand }) => hand.reduce((highest, card) => (card > highest ? card : highest));

/**
 * Bid the card closest to the prize in face value — spend roughly what the prize is worth.
 *
 * The prize comes from the kitty and every card is unique, so no player can hold it: the
 * distance is never zero. Equal distances either side (prize 20, holding 17 and 23) are
 * broken toward the **lower** card — the same chance of winning for the cheaper card.
 */
const nearest: Strategy = ({ hand, prize }) =>
	hand.reduce((best, card) => {
		const d = Math.abs(card - prize);
		const bestD = Math.abs(best - prize);
		if (d < bestD) return card;
		if (d === bestD) return Math.min(card, best);
		return best;
	});

/**
 * Contest the prizes worth having and concede the rest: play `nearest` when the prize is
 * in the top half of the deck, and dump the lowest card otherwise (TODO-006).
 */
const hybrid: Strategy = (context) =>
	context.prize > context.deckSize / 2 ? nearest(context) : min(context);

const STRATEGIES: Record<StrategyId, Strategy> = {
	nextCard,
	min,
	max,
	nearest,
	hybrid
};

/** Every strategy a computer player may be given, in the order the UI lists them. */
export const STRATEGY_IDS: readonly StrategyId[] = Object.keys(STRATEGIES) as StrategyId[];

export function getStrategy(id: StrategyId): Strategy {
	const strategy = STRATEGIES[id];
	if (!strategy) throw new Error(`unknown strategy: ${id}`);
	return strategy;
}

/** Human-readable label for the UI (the domain stays UI-free; this is just text). */
export const STRATEGY_LABELS: Record<StrategyId, string> = {
	nextCard: 'Next',
	min: 'Min',
	max: 'Max',
	nearest: 'Nearest',
	hybrid: 'Hybrid'
};

/**
 * Pick `count` *distinct* strategies at random — how /play assigns the computer seats, so
 * no two of them play the same way and every game is a different table (TODO-006).
 *
 * Takes an `Rng` rather than reaching for `Math.random`, so a game stays reproducible from
 * its seed: same seed, same opponents, same deal.
 */
export function randomStrategies(count: number, rng: Rng): StrategyId[] {
	if (!Number.isInteger(count) || count < 0 || count > STRATEGY_IDS.length) {
		throw new Error(`cannot pick ${count} distinct strategies from ${STRATEGY_IDS.length}`);
	}
	const pool = [...STRATEGY_IDS];
	const picked: StrategyId[] = [];
	for (let i = 0; i < count; i++) {
		picked.push(...pool.splice(rng.nextInt(pool.length), 1));
	}
	return picked;
}
