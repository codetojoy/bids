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
import { defaultSettings, normalizeSettings } from '../../src/lib/ui/settings.ts';

describe('the theme registry', () => {
	it('offers Cream, and only Cream, for now', () => {
		expect(THEMES.map((t) => t.id)).toEqual(['cream']);
		expect(themeLabel('cream')).toBe('Cream');
	});

	it('defaults to Cream — the palette the app already wears', () => {
		expect(DEFAULT_THEME_ID).toBe('cream');
		expect(isThemeId(DEFAULT_THEME_ID)).toBe(true);
	});

	it('recognizes only ids that are actually in the registry', () => {
		expect(isThemeId('cream')).toBe(true);
		expect(isThemeId('midnight')).toBe(false);
		expect(isThemeId(null)).toBe(false);
		expect(isThemeId(42)).toBe(false);
	});
});

describe('parseThemeId', () => {
	it('keeps a known id', () => {
		expect(parseThemeId('cream')).toBe('cream');
	});

	/* The stored value is untrusted: it can be absent, hand-edited, or an id from a build
	   that offered a theme this one doesn't. None of that may throw or blank the app. */
	it('falls back to the default for anything unknown', () => {
		for (const bad of ['midnight', '', null, undefined, 7, {}, []]) {
			expect(parseThemeId(bad)).toBe(DEFAULT_THEME_ID);
		}
	});
});

describe('normalizeSettings', () => {
	it('reads a well-formed stored blob', () => {
		expect(normalizeSettings({ themeId: 'cream' })).toEqual({ themeId: 'cream' });
	});

	it('returns the defaults for a missing, empty, or malformed blob', () => {
		for (const bad of [null, undefined, {}, 'cream', 42, { themeId: 'midnight' }]) {
			expect(normalizeSettings(bad)).toEqual(defaultSettings());
		}
	});

	it('ignores unknown keys rather than carrying them through', () => {
		expect(normalizeSettings({ themeId: 'cream', volume: 11 })).toEqual({ themeId: 'cream' });
	});
});
