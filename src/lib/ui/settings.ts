/**
 * Settings persistence (SPEC §3: state is in-memory, persisted to localStorage; SPEC §1:
 * nothing ever leaves the device). Safe to call during SSR/prerender — every route is
 * prerendered, so on the server these simply return the defaults and write nothing.
 *
 * The stored blob is untrusted: it may be absent, corrupt, hand-edited, or written by an
 * older build that knew different theme ids. Every read therefore goes through
 * `parseThemeId`, which falls back to the default rather than throwing.
 */

import { browser } from '$app/environment';
import { DEFAULT_DECK_SIZE, isValidDeckSize } from '../domain/deck.ts';
import { DEFAULT_CONFIG, HUMAN_ID } from '../domain/game-state.ts';
import { AUTO, isStrategyChoice, type StrategyChoice } from '../domain/strategy.ts';
import { DEFAULT_THEME_ID, parseThemeId, themeFor, type ThemeId } from './theme.ts';

const STORAGE_KEY = 'bids.settings.v1';

/** The seat count the settings are validated against — fixed until seats are addable. */
const PLAYER_COUNT = DEFAULT_CONFIG.players.length;

export const DEFAULT_SHOW_STRATEGY = false;

/** A player name has to fit a scoreboard row and be worth reading (TODO-007). */
export const NAME_MIN_LENGTH = 4;
export const NAME_MAX_LENGTH = 10;

/** One configurable computer seat (TODO-007). The human seat is not configurable. */
export interface SeatSettings {
	name: string;
	/** What the seat is set to — a named strategy, or Auto: deal it one per game. */
	strategy: StrategyChoice;
}

export interface Settings {
	themeId: ThemeId;
	deckSize: number;
	/** Show each computer player's strategy beside its name during play (TODO-006). */
	showStrategy: boolean;
	/** The computer seats, in seat order — the human (seat 0) is not among them. */
	players: SeatSettings[];
}

/** The computer seats as they come out of the box: named, and left on Auto. */
export function defaultSeats(): SeatSettings[] {
	return DEFAULT_CONFIG.players
		.filter((_, id) => id !== HUMAN_ID)
		.map((player) => ({ name: player.name, strategy: AUTO }));
}

export function defaultSettings(): Settings {
	return {
		themeId: DEFAULT_THEME_ID,
		deckSize: DEFAULT_DECK_SIZE,
		showStrategy: DEFAULT_SHOW_STRATEGY,
		players: defaultSeats()
	};
}

/** Coerce a stored deck size to a playable one, falling back to the default (TODO-005). */
export function parseDeckSize(value: unknown): number {
	return isValidDeckSize(value, PLAYER_COUNT) ? value : DEFAULT_DECK_SIZE;
}

/**
 * Coerce a stored flag to a boolean (TODO-006). Strictly a boolean: a blob written before
 * this setting existed has no such field, and anything else in it is not to be trusted into
 * a truthiness test.
 */
export function parseShowStrategy(value: unknown): boolean {
	return typeof value === 'boolean' ? value : DEFAULT_SHOW_STRATEGY;
}

/** Is this a name a player may actually be given? Trimmed length, 4–10 (TODO-007). */
export function isValidName(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		value.trim().length >= NAME_MIN_LENGTH &&
		value.trim().length <= NAME_MAX_LENGTH
	);
}

/** Coerce a stored name, falling back to the seat's default rather than leaving it blank. */
export function parseName(value: unknown, fallback: string): string {
	return isValidName(value) ? value.trim() : fallback;
}

export function parseStrategyChoice(value: unknown): StrategyChoice {
	return isStrategyChoice(value) ? value : AUTO;
}

/**
 * Coerce the stored computer seats (TODO-007). Positional: entry 0 is the seat after the
 * human. A blob with no `players`, too few, too many, or junk in one of them still yields a
 * playable table — each seat, and each field within it, falls back on its own.
 */
export function parseSeats(value: unknown): SeatSettings[] {
	const stored = Array.isArray(value) ? value : [];
	return defaultSeats().map((fallback, i) => {
		const seat = stored[i] && typeof stored[i] === 'object' ? (stored[i] as Record<string, unknown>) : {};
		return {
			name: parseName(seat.name, fallback.name),
			strategy: parseStrategyChoice(seat.strategy)
		};
	});
}

/** Normalize an arbitrary parsed blob into usable settings. Pure — exported for testing. */
export function normalizeSettings(raw: unknown): Settings {
	const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	return {
		themeId: parseThemeId(obj.themeId),
		deckSize: parseDeckSize(obj.deckSize),
		showStrategy: parseShowStrategy(obj.showStrategy),
		players: parseSeats(obj.players)
	};
}

export function loadSettings(): Settings {
	if (!browser) return defaultSettings();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaultSettings();
		return normalizeSettings(JSON.parse(raw));
	} catch {
		// Unparseable, or localStorage unavailable (private mode, storage disabled).
		return defaultSettings();
	}
}

export function saveSettings(settings: Settings): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Storage full or blocked: the app still works, the choice just won't survive a reload.
	}
}

/**
 * Put the theme on the document root so the CSS variables for it apply
 * (`:root[data-theme="…"]` in +layout.svelte), and match the browser chrome to it.
 * Called on every change, and on load — where it re-asserts what the pre-paint script in
 * app.html already did.
 */
export function applyTheme(themeId: ThemeId): void {
	if (!browser) return;
	const theme = themeFor(themeId);
	document.documentElement.dataset.theme = theme.id;
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', theme.themeColor);
}
