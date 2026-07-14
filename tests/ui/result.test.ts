/**
 * The game-over headline (TODO-008). It lives in a pure function precisely so the tie lines
 * can be tested: a tie is essentially unreachable by driving the app, because the UI has no
 * seed control — but scores *can* tie, so the lines have to be right when it happens.
 */
import { describe, expect, it } from 'vitest';
import { HUMAN_ID } from '../../src/lib/domain/game-state.ts';
import type { Standing } from '../../src/lib/domain/scoring.ts';
import { HANDSHAKE_EMOJI, resultMessage, WIN_EMOJI } from '../../src/lib/ui/result.ts';

const you: Standing = { playerId: HUMAN_ID, name: 'You', score: 90 };
const mozart: Standing = { playerId: 1, name: 'Mozart', score: 90 };
const brahms: Standing = { playerId: 2, name: 'Brahms', score: 90 };
const chopin: Standing = { playerId: 3, name: 'Chopin', score: 90 };

describe('resultMessage', () => {
	it('celebrates an outright human win', () => {
		expect(resultMessage([you])).toEqual({ emoji: WIN_EMOJI, text: 'You win!' });
	});

	it('shakes hands on an outright computer win', () => {
		expect(resultMessage([brahms])).toEqual({ emoji: HANDSHAKE_EMOJI, text: 'Brahms wins.' });
	});

	/* A shared win is still a win: the emoji turns on whether the human is *among* the
	   winners, not on whether they won alone. */
	it('celebrates a tie the human is in', () => {
		expect(resultMessage([you, brahms])).toEqual({
			emoji: WIN_EMOJI,
			text: 'You tie with Brahms.'
		});
		expect(resultMessage([you, mozart, chopin])).toEqual({
			emoji: WIN_EMOJI,
			text: 'You tie with Mozart and Chopin.'
		});
	});

	it('shakes hands on a tie between computers', () => {
		expect(resultMessage([brahms, chopin])).toEqual({
			emoji: HANDSHAKE_EMOJI,
			text: 'Brahms and Chopin tie.'
		});
		expect(resultMessage([mozart, brahms, chopin])).toEqual({
			emoji: HANDSHAKE_EMOJI,
			text: 'Mozart, Brahms and Chopin tie.'
		});
	});

	/* The standings list right below the headline carries the numbers. */
	it('never quotes a score — that would only repeat the standings', () => {
		for (const winners of [[you], [brahms], [you, brahms], [mozart, brahms, chopin]]) {
			expect(resultMessage(winners).text).not.toMatch(/\d/);
		}
	});

	it('names the seat as it is currently called, not as it was configured', () => {
		expect(resultMessage([{ playerId: 2, name: 'Grace', score: 12 }]).text).toBe('Grace wins.');
	});

	it('refuses an empty winner list — a finished game always has one', () => {
		expect(() => resultMessage([])).toThrow(/at least one winner/);
	});
});
