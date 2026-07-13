import type { Card } from './deck.ts';
import type { Bid, GameState, PlayerId } from './game-state.ts';

/**
 * Who wins a round, and who wins the game.
 *
 * The winner of a round is simply the highest bid — and because every card in the deck
 * is unique, two players can never bid the same number, so "highest" is always a single
 * player. That invariant is asserted in `resolveRound`; a duplicate bid means a bug in
 * the dealer or a strategy, not a rules situation to break the tie for.
 */
export function resolveRound(bids: readonly Bid[]): PlayerId {
	if (bids.length === 0) throw new Error('cannot resolve a round with no bids');

	const seen = new Set<Card>();
	for (const bid of bids) {
		if (seen.has(bid.card)) {
			throw new Error(
				`duplicate bid of ${bid.card}: every card is unique, so this cannot happen — the deal or a strategy is broken`
			);
		}
		seen.add(bid.card);
	}

	return bids.reduce((best, bid) => (bid.card > best.card ? bid : best)).playerId;
}

/** The prize card's points, awarded to the round's winner. A card is worth its face value. */
export function prizeValue(prize: Card): number {
	return prize;
}

export interface Standing {
	playerId: PlayerId;
	name: string;
	score: number;
}

/** Final (or running) standings, highest score first. */
export function standings(state: GameState): Standing[] {
	return state.players
		.map((p) => ({ playerId: p.id, name: p.name, score: state.scores[p.id] }))
		.sort((a, b) => b.score - a.score || a.playerId - b.playerId);
}

/**
 * The winning player(s). Scores *can* tie — unlike bids — so this returns a list: one
 * player for an outright win, several for a shared one.
 */
export function gameWinners(state: GameState): Standing[] {
	const table = standings(state);
	const top = table[0].score;
	return table.filter((s) => s.score === top);
}
