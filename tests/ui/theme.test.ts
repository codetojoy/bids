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
import {
	defaultSeats,
	defaultSettings,
	isValidName,
	normalizeSettings,
	parseDeckSize,
	parseName,
	parseSeats,
	parseShowStrategy
} from '../../src/lib/ui/settings.ts';

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

describe('parseShowStrategy', () => {
	it('keeps a stored boolean', () => {
		expect(parseShowStrategy(true)).toBe(true);
		expect(parseShowStrategy(false)).toBe(false);
	});

	/* Strictly a boolean: a truthy 'false' string or a stray 1 is corruption, not a yes. */
	it('falls back to off for anything that is not one', () => {
		for (const bad of ['true', 'false', 1, 0, null, undefined, {}]) {
			expect(parseShowStrategy(bad)).toBe(false);
		}
	});
});

describe('isValidName / parseName (TODO-007)', () => {
	it('accepts a name of 4 to 10 characters', () => {
		for (const name of ['Ada!', 'Mozart', 'Ludwig van'.slice(0, 10)]) {
			expect(isValidName(name)).toBe(true);
			expect(parseName(name, 'Mozart')).toBe(name);
		}
	});

	it('rejects one that is too short, too long, or not a string at all', () => {
		for (const bad of ['', 'Moz', '   ', 'Rachmaninoff', 4, null, undefined, {}, ['Ada']]) {
			expect(isValidName(bad)).toBe(false);
			expect(parseName(bad, 'Mozart')).toBe('Mozart'); // the seat's own default, not a blank
		}
	});

	it('measures and stores the trimmed name — surrounding space is not length', () => {
		expect(isValidName('  Ada  ')).toBe(false); // 'Ada' is 3
		expect(parseName('  Ada  ', 'Mozart')).toBe('Mozart');
		expect(parseName('  Grace  ', 'Mozart')).toBe('Grace');
	});
});

describe('parseSeats (TODO-007)', () => {
	it('reads well-formed seats', () => {
		expect(
			parseSeats([
				{ name: 'Ada', strategy: 'min' }, // too short — falls back to the seat default
				{ name: 'Grace', strategy: 'max' },
				{ name: 'Alan', strategy: 'auto' }
			])
		).toEqual([
			{ name: 'Mozart', strategy: 'min' },
			{ name: 'Grace', strategy: 'max' },
			{ name: 'Alan', strategy: 'auto' }
		]);
	});

	/* Positional and always three seats: a blob with too few, too many, or junk in one of them
	   still yields a playable table rather than a game with no opponents. */
	it('returns the default seats for a missing or malformed array', () => {
		for (const bad of [undefined, null, 'Mozart', 42, {}, []]) {
			expect(parseSeats(bad)).toEqual(defaultSeats());
		}
	});

	it('fills the seats a short array does not reach, and drops the extras', () => {
		expect(parseSeats([{ name: 'Grace', strategy: 'hybrid' }])).toEqual([
			{ name: 'Grace', strategy: 'hybrid' },
			{ name: 'Brahms', strategy: 'auto' },
			{ name: 'Chopin', strategy: 'auto' }
		]);
		expect(parseSeats(Array(9).fill({ name: 'Grace', strategy: 'min' }))).toHaveLength(3);
	});

	it('salvages the good half of a corrupt seat', () => {
		expect(parseSeats([{ name: 'Grace', strategy: 'telepathy' }, null, { strategy: 'max' }])).toEqual([
			{ name: 'Grace', strategy: 'auto' }, // unknown strategy → Auto, the name survives
			{ name: 'Brahms', strategy: 'auto' },
			{ name: 'Chopin', strategy: 'max' } // missing name → the seat default, the choice survives
		]);
	});
});

describe('normalizeSettings', () => {
	const seats = [
		{ name: 'Grace', strategy: 'max' as const },
		{ name: 'Brahms', strategy: 'auto' as const },
		{ name: 'Chopin', strategy: 'auto' as const }
	];

	it('reads a well-formed stored blob', () => {
		expect(
			normalizeSettings({ themeId: 'cream', deckSize: 40, showStrategy: false, players: seats })
		).toEqual({ themeId: 'cream', deckSize: 40, showStrategy: false, players: seats });
		expect(
			normalizeSettings({ themeId: 'tiger', deckSize: 25, showStrategy: true, players: seats })
		).toEqual({ themeId: 'tiger', deckSize: 25, showStrategy: true, players: seats });
	});

	it('returns the defaults for a missing, empty, or malformed blob', () => {
		for (const bad of [null, undefined, {}, 'cream', 42, { themeId: 'midnight', deckSize: 7 }]) {
			expect(normalizeSettings(bad)).toEqual(defaultSettings());
		}
	});

	/* A blob written before deck size, the strategy toggle, or the players existed (TODO-003 →
	   TODO-005 → TODO-006 → TODO-007) must still load: each missing field takes its default
	   rather than blanking the settings beside it. */
	it('fills in a field an older build never wrote', () => {
		expect(normalizeSettings({ themeId: 'tiger' })).toEqual({
			...defaultSettings(),
			themeId: 'tiger'
		});
		expect(normalizeSettings({ themeId: 'tiger', deckSize: 25, showStrategy: true })).toEqual({
			...defaultSettings(),
			themeId: 'tiger',
			deckSize: 25,
			showStrategy: true
		});
	});

	it('salvages the good half of a partly-corrupt blob', () => {
		expect(
			normalizeSettings({ themeId: 'midnight', deckSize: 25, showStrategy: true, players: seats })
		).toEqual({ themeId: 'cream', deckSize: 25, showStrategy: true, players: seats });
	});

	it('ignores unknown keys rather than carrying them through', () => {
		expect(normalizeSettings({ themeId: 'cream', deckSize: 40, volume: 11 })).toEqual(
			defaultSettings()
		);
	});
});
