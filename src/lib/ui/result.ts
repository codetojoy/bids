/**
 * The game-over headline (TODO-008). Pure, so all four lines — including the tie, which is
 * essentially unreachable by driving the app (the UI has no seed control) — are unit-tested.
 *
 * The emojis follow the sibling forty-fives project: 🎉 when the human wins, 🤝 (the
 * post-game handshake — gracious rather than glum) when the computers do. A shared win still
 * reads as a win, so the emoji turns on whether the human is *among* the winners.
 *
 * No score in the line: the final standings sit directly beneath it and give every seat's.
 */

import { HUMAN_ID, type PlayerId } from '../domain/game-state.ts';
import type { Standing } from '../domain/scoring.ts';

export const WIN_EMOJI = '🎉';
export const HANDSHAKE_EMOJI = '🤝';

export interface ResultMessage {
	/** Decorative — rendered aria-hidden, so it is never read out as "party popper". */
	emoji: string;
	text: string;
}

/** Join names the way a sentence does: "Brahms and Chopin", "Mozart, Brahms and Chopin". */
function listNames(names: readonly string[]): string {
	if (names.length <= 1) return names[0] ?? '';
	return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * `winners` is `gameWinners(state)`: one player for an outright win, several for a shared one
 * (scores can tie, even though bids cannot).
 */
export function resultMessage(
	winners: readonly Standing[],
	humanId: PlayerId = HUMAN_ID
): ResultMessage {
	if (winners.length === 0) throw new Error('a finished game always has at least one winner');

	const humanWon = winners.some((w) => w.playerId === humanId);
	const emoji = humanWon ? WIN_EMOJI : HANDSHAKE_EMOJI;

	if (winners.length === 1) {
		return humanWon
			? { emoji, text: 'You win!' }
			: { emoji, text: `${winners[0].name} wins.` };
	}

	const others = listNames(winners.filter((w) => w.playerId !== humanId).map((w) => w.name));
	return humanWon
		? { emoji, text: `You tie with ${others}.` }
		: { emoji, text: `${others} tie.` };
}
