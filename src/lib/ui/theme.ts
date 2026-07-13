/**
 * The visual themes offered on /config (TODO-003, TODO-004).
 *
 * A theme is a UI concern, not a game rule, so it lives here rather than in
 * `src/lib/domain/` (which stays free of anything UI). The palette itself is CSS custom
 * properties in `+layout.svelte`: the base `:root` is Cream (the default), and each other
 * theme is a `:root[data-theme='<id>']` block overriding the colour tokens. This module
 * just names the themes; the Config dropdown renders from `THEMES`.
 *
 * Adding a theme: an entry here, a token block in `+layout.svelte`, and an entry in the
 * pre-paint map in `src/app.html` (see the NOTE below).
 *
 * This module is pure (no `browser`, no storage), so it can be unit-tested directly;
 * `settings.ts` is the part that touches localStorage and the live DOM.
 */

export type ThemeId = 'cream' | 'dark' | 'tiger';

export interface Theme {
	/** Slug used as the `data-theme` attribute value and stored in settings. */
	id: ThemeId;
	/** Human label shown in the Config dropdown. */
	label: string;
	/** Browser-chrome colour (`<meta name="theme-color">`) while this theme is active. */
	themeColor: string;
}

// NOTE: the anti-flash inline script in src/app.html hardcodes an equivalent id → colour
// map (it runs before this module can load), and the palettes live in +layout.svelte.
// Keep all three in sync when adding a theme.
export const THEMES: readonly Theme[] = [
	{ id: 'cream', label: 'Cream', themeColor: '#9c4632' },
	{ id: 'dark', label: 'Dark', themeColor: '#4f8ef0' },
	{ id: 'tiger', label: 'Tiger', themeColor: '#d9631a' }
];

export const DEFAULT_THEME_ID: ThemeId = 'cream';

export function isThemeId(value: unknown): value is ThemeId {
	return typeof value === 'string' && THEMES.some((t) => t.id === value);
}

/** Coerce anything (a stored string, a stale id from an older build) to a usable theme. */
export function parseThemeId(value: unknown): ThemeId {
	return isThemeId(value) ? value : DEFAULT_THEME_ID;
}

export function themeFor(id: ThemeId): Theme {
	return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function themeLabel(id: ThemeId): string {
	return themeFor(id).label;
}
