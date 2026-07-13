import {
	buildDeck,
	deal,
	DECK_SIZE_MAX,
	DECK_SIZE_MIN,
	DEFAULT_DECK_SIZE,
	isValidDeckSize,
	shuffle,
	type Card
} from './deck.ts';
import { makeRng, type Rng } from './rng.ts';
import { prizeValue, resolveRound } from './scoring.ts';
import { getStrategy, type StrategyId } from './strategy.ts';

/**
 * Immutable game state and the pure transitions over it (SPEC §9). `GameState` is plain
 * JSON-able data — no classes, no functions, no Date objects — so it can be persisted or
 * handed to the UI as-is. Every transition returns a *new* state and validates its input,
 * throwing rather than silently accepting an impossible move.
 */

/** Index into `players` / `hands` / `scores`. Seat 0 is the human. */
export type PlayerId = number;

export const HUMAN_ID: PlayerId = 0;

export interface Player {
	id: PlayerId;
	name: string;
	/** null for the human — their card comes from the UI, not a strategy. */
	strategy: StrategyId | null;
}

export interface Bid {
	playerId: PlayerId;
	card: Card;
}

export interface RoundResult {
	/** 0-based round index. */
	round: number;
	prize: Card;
	/** One bid per player, seat order. */
	bids: Bid[];
	winnerId: PlayerId;
	/** Points the winner took — the prize card's face value. */
	points: number;
}

export interface GameConfig {
	deckSize: number;
	/** Seat order. The human is seat 0; every other seat needs a strategy. */
	players: { name: string; strategy: StrategyId | null }[];
	seed: number;
}

export interface GameState {
	config: GameConfig;
	players: Player[];
	/** Remaining cards per seat, in dealt order. */
	hands: Card[][];
	/** The prize pool, in reveal order. Fixed at the deal; `round` indexes into it. */
	kitty: Card[];
	/** 0-based index of the round about to be played; equals kitty.length when complete. */
	round: number;
	scores: number[];
	history: RoundResult[];
	phase: 'bidding' | 'complete';
}

/** The defaults: a 1..40 deck, you against Mozart, Brahms and Chopin. */
export const DEFAULT_CONFIG: Omit<GameConfig, 'seed'> = {
	deckSize: DEFAULT_DECK_SIZE,
	players: [
		{ name: 'You', strategy: null },
		{ name: 'Mozart', strategy: 'nextCard' },
		{ name: 'Brahms', strategy: 'nextCard' },
		{ name: 'Chopin', strategy: 'nextCard' }
	]
};

export function startGame(config: GameConfig, rng: Rng = makeRng(config.seed)): GameState {
	if (config.players.length < 2) {
		throw new Error(`need at least 2 players, got ${config.players.length}`);
	}
	if (config.players[HUMAN_ID].strategy !== null) {
		throw new Error('seat 0 is the human seat and must not have a strategy');
	}
	if (!isValidDeckSize(config.deckSize, config.players.length)) {
		throw new Error(
			`deck size ${config.deckSize} is not playable with ${config.players.length} players: ` +
				`it must be ${DECK_SIZE_MIN}–${DECK_SIZE_MAX} and divide evenly among the players and the kitty`
		);
	}

	const { hands, kitty } = deal(shuffle(buildDeck(config.deckSize), rng), config.players.length);
	const players = config.players.map((p, id) => ({ id, name: p.name, strategy: p.strategy }));

	return {
		config,
		players,
		hands,
		kitty,
		round: 0,
		scores: players.map(() => 0),
		history: [],
		phase: 'bidding'
	};
}

/** The card on offer this round, or null once the game is over. */
export function currentPrize(state: GameState): Card | null {
	return state.phase === 'complete' ? null : state.kitty[state.round];
}

/**
 * Play one round: the human bids `humanCard`, every computer player bids what its strategy
 * chooses, the highest bid takes the prize card's points, and all four bids plus the prize
 * are discarded. Bids are simultaneous — a strategy only ever sees its own hand and the
 * prize, never the human's card.
 */
export function playRound(state: GameState, humanCard: Card): GameState {
	if (state.phase === 'complete') {
		throw new Error('the game is over');
	}
	if (!state.hands[HUMAN_ID].includes(humanCard)) {
		throw new Error(`you do not hold the card ${humanCard}`);
	}

	const prize = state.kitty[state.round];

	const bids: Bid[] = state.players.map((player) => {
		if (player.strategy === null) return { playerId: player.id, card: humanCard };
		const hand = state.hands[player.id];
		const card = getStrategy(player.strategy)({ hand, prize });
		if (!hand.includes(card)) {
			throw new Error(`${player.name}'s strategy bid ${card}, which is not in their hand`);
		}
		return { playerId: player.id, card };
	});

	const winnerId = resolveRound(bids);
	const points = prizeValue(prize);

	const hands = state.hands.map((hand, id) => {
		const bid = bids[id].card;
		const at = hand.indexOf(bid);
		return [...hand.slice(0, at), ...hand.slice(at + 1)];
	});
	const scores = state.scores.map((score, id) => (id === winnerId ? score + points : score));
	const round = state.round + 1;

	return {
		...state,
		hands,
		scores,
		round,
		history: [...state.history, { round: state.round, prize, bids, winnerId, points }],
		phase: round === state.kitty.length ? 'complete' : 'bidding'
	};
}
