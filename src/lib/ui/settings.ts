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
import { DEFAULT_CONFIG } from '../domain/game-state.ts';
import { DEFAULT_THEME_ID, parseThemeId, themeFor, type ThemeId } from './theme.ts';

const STORAGE_KEY = 'bids.settings.v1';

/** The seat count the settings are validated against — fixed until players are configurable. */
const PLAYER_COUNT = DEFAULT_CONFIG.players.length;

export const DEFAULT_SHOW_STRATEGY = false;

export interface Settings {
	themeId: ThemeId;
	deckSize: number;
	/** Show each computer player's strategy beside its name during play (TODO-006). */
	showStrategy: boolean;
}

export function defaultSettings(): Settings {
	return {
		themeId: DEFAULT_THEME_ID,
		deckSize: DEFAULT_DECK_SIZE,
		showStrategy: DEFAULT_SHOW_STRATEGY
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

/** Normalize an arbitrary parsed blob into usable settings. Pure — exported for testing. */
export function normalizeSettings(raw: unknown): Settings {
	const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	return {
		themeId: parseThemeId(obj.themeId),
		deckSize: parseDeckSize(obj.deckSize),
		showStrategy: parseShowStrategy(obj.showStrategy)
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
