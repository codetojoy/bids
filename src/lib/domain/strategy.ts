import type { Card } from './deck.ts';

/**
 * How a computer player picks the card it bids (SPEC §4, strategy pattern).
 *
 * A strategy is a pure function of the information a player legitimately has when
 * bidding: their own hand and the prize card on offer. Bids are simultaneous, so a
 * strategy never sees what anyone else bids this round.
 *
 * TODO-002 ships only `nextCard`, a deliberately trivial baseline; the min / max /
 * nearest-to-prize / hybrid strategies of SPEC §4 are added here as more entries, with
 * no changes anywhere else.
 */
export interface BiddingContext {
	/** The player's remaining cards, in dealt order. Never empty when a bid is asked for. */
	readonly hand: readonly Card[];
	/** The card whose points are on offer this round. */
	readonly prize: Card;
}

export type Strategy = (context: BiddingContext) => Card;

export type StrategyId = 'nextCard';

/** Bid the next card in the hand as dealt — the simplest possible opponent (TODO-002). */
const nextCard: Strategy = ({ hand }) => hand[0];

const STRATEGIES: Record<StrategyId, Strategy> = {
	nextCard
};

export function getStrategy(id: StrategyId): Strategy {
	const strategy = STRATEGIES[id];
	if (!strategy) throw new Error(`unknown strategy: ${id}`);
	return strategy;
}

/** Human-readable label for the UI (the domain stays UI-free; this is just text). */
export const STRATEGY_LABELS: Record<StrategyId, string> = {
	nextCard: 'Next card'
};
