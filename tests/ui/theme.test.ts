/**
 * The pure half of the theme setting (TODO-003): the registry and the coercion of an
 * untrusted stored value. The localStorage plumbing in settings.ts is browser-only and is
 * exercised by driving the real Config page; `normalizeSettings` — the part that decides
 * what a stored blob *means* — is pure and tested here.
 */
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_THEME_ID,
	THEMES,
	isThemeId,
	parseThemeId,
	themeLabel
} from '../../src/lib/ui/theme.ts';
import { defaultSettings, normalizeSettings, parseDeckSize } from '../../src/lib/ui/settings.ts';

describe('the theme registry', () => {
	it('offers Cream, Dark and Tiger', () => {
		expect(THEMES.map((t) => t.id)).toEqual(['cream', 'dark', 'tiger']);
		expect(THEMES.map((t) => t.label)).toEqual(['Cream', 'Dark', 'Tiger']);
		expect(themeLabel('tiger')).toBe('Tiger');
	});

	it('defaults to Cream — the palette the app wears unqualified', () => {
		expect(DEFAULT_THEME_ID).toBe('cream');
		expect(isThemeId(DEFAULT_THEME_ID)).toBe(true);
	});

	it('gives every theme a browser-chrome colour', () => {
		for (const theme of THEMES) {
			expect(theme.themeColor).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});

	it('recognizes only ids that are actually in the registry', () => {
		expect(isThemeId('cream')).toBe(true);
		expect(isThemeId('dark')).toBe(true);
		expect(isThemeId('tiger')).toBe(true);
		expect(isThemeId('bengal')).toBe(false); // cryptogram's name for Tiger — not ours
		expect(isThemeId(null)).toBe(false);
		expect(isThemeId(42)).toBe(false);
	});
});

describe('parseThemeId', () => {
	it('keeps a known id', () => {
		expect(parseThemeId('cream')).toBe('cream');
		expect(parseThemeId('dark')).toBe('dark');
		expect(parseThemeId('tiger')).toBe('tiger');
	});

	/* The stored value is untrusted: it can be absent, hand-edited, or an id from a build
	   that offered a theme this one doesn't. None of that may throw or blank the app. */
	it('falls back to the default for anything unknown', () => {
		for (const bad of ['midnight', '', null, undefined, 7, {}, []]) {
			expect(parseThemeId(bad)).toBe(DEFAULT_THEME_ID);
		}
	});
});

describe('parseDeckSize', () => {
	it('keeps a playable deck size', () => {
		expect(parseDeckSize(20)).toBe(20);
		expect(parseDeckSize(40)).toBe(40);
		expect(parseDeckSize(60)).toBe(60);
	});

	/* Same discipline as the theme: the stored value is untrusted, and an unplayable deck
	   must not reach startGame (which throws) — it falls back to the default instead. */
	it('falls back to 40 for anything unplayable', () => {
		for (const bad of [19, 21, 15, 65, 42.5, '40', null, undefined, {}]) {
			expect(parseDeckSize(bad)).toBe(40);
		}
	});
});

describe('normalizeSettings', () => {
	it('reads a well-formed stored blob', () => {
		expect(normalizeSettings({ themeId: 'cream', deckSize: 40 })).toEqual({
			themeId: 'cream',
			deckSize: 40
		});
		expect(normalizeSettings({ themeId: 'tiger', deckSize: 25 })).toEqual({
			themeId: 'tiger',
			deckSize: 25
		});
	});

	it('returns the defaults for a missing, empty, or malformed blob', () => {
		for (const bad of [null, undefined, {}, 'cream', 42, { themeId: 'midnight', deckSize: 7 }]) {
			expect(normalizeSettings(bad)).toEqual(defaultSettings());
		}
	});

	/* A blob written before deck size existed (TODO-003 → TODO-005) must still load: the
	   missing field takes the default rather than blanking the theme beside it. */
	it('fills in a field an older build never wrote', () => {
		expect(normalizeSettings({ themeId: 'tiger' })).toEqual({ themeId: 'tiger', deckSize: 40 });
	});

	it('salvages the good half of a partly-corrupt blob', () => {
		expect(normalizeSettings({ themeId: 'midnight', deckSize: 25 })).toEqual({
			themeId: 'cream',
			deckSize: 25
		});
	});

	it('ignores unknown keys rather than carrying them through', () => {
		expect(normalizeSettings({ themeId: 'cream', deckSize: 40, volume: 11 })).toEqual({
			themeId: 'cream',
			deckSize: 40
		});
	});
});
