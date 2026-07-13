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
import { DEFAULT_THEME_ID, parseThemeId, type ThemeId } from './theme.ts';

const STORAGE_KEY = 'bids.settings.v1';

export interface Settings {
	themeId: ThemeId;
}

export function defaultSettings(): Settings {
	return { themeId: DEFAULT_THEME_ID };
}

/** Normalize an arbitrary parsed blob into usable settings. Pure — exported for testing. */
export function normalizeSettings(raw: unknown): Settings {
	const themeId = raw && typeof raw === 'object' ? (raw as Record<string, unknown>).themeId : null;
	return { themeId: parseThemeId(themeId) };
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
 * (`:root[data-theme="…"]` in +layout.svelte). Called on load and on every change.
 */
export function applyTheme(themeId: ThemeId): void {
	if (!browser) return;
	document.documentElement.dataset.theme = themeId;
}
