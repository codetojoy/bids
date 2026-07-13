/**
 * The visual themes offered on /config (TODO-003).
 *
 * A theme is a UI concern, not a game rule, so it lives here rather than in
 * `src/lib/domain/` (which stays free of anything UI). Today "Cream" is the only theme —
 * the warm cream/rust palette the app already wears. Adding another means adding an entry
 * to `THEMES` and a matching `:root[data-theme="…"]` block of design tokens in
 * `+layout.svelte`; the Config dropdown picks it up with no further changes.
 *
 * This module is pure (no `browser`, no storage), so it can be unit-tested directly;
 * `settings.ts` is the part that touches localStorage.
 */

export type ThemeId = 'cream';

export interface Theme {
	id: ThemeId;
	label: string;
}

export const THEMES: readonly Theme[] = [{ id: 'cream', label: 'Cream' }];

export const DEFAULT_THEME_ID: ThemeId = 'cream';

export function isThemeId(value: unknown): value is ThemeId {
	return typeof value === 'string' && THEMES.some((t) => t.id === value);
}

/** Coerce anything (a stored string, a stale id from an older build) to a usable theme. */
export function parseThemeId(value: unknown): ThemeId {
	return isThemeId(value) ? value : DEFAULT_THEME_ID;
}

export function themeLabel(id: ThemeId): string {
	return THEMES.find((t) => t.id === id)?.label ?? id;
}
