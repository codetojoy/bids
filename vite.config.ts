import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import pkg from './package.json' with { type: 'json' };

// Base path for subpath hosting (GitHub Pages project site). Defaults to '' so
// `npm run dev` and root deploys serve from '/'; `npm run build:gh-pages` sets
// BASE_PATH=/bids. SvelteKit requires '' or a string starting with '/', so
// normalize a missing leading slash.
const rawBase = process.env.BASE_PATH ?? '';
const base = (rawBase && !rawBase.startsWith('/') ? `/${rawBase}` : rawBase) as
	| ''
	| `/${string}`;

// Format a Date as dd-MMM-YYYY HH:mm tz in Atlantic Time, e.g. "13-JUL-2026 15:30 ADT".
function formatAtlanticTimestamp(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/Halifax',
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZoneName: 'short'
	}).formatToParts(date);
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
	const day = get('day');
	const month = get('month').toUpperCase();
	const year = get('year');
	const hour = get('hour') === '24' ? '00' : get('hour'); // 24h clock can emit '24' at midnight
	const minute = get('minute');
	const tz = get('timeZoneName');
	return `${day}-${month}-${year} ${hour}:${minute} ${tz}`;
}

// Build-time metadata baked into the prerendered /about page. Captured at config-eval
// time and injected via `define` (textual replacement), so the values end up as literals
// in the static HTML — no runtime/network lookup. The version is read from package.json —
// bump it there. The commit hash is HEAD at build time, so a later "bump version" commit
// won't be reflected.
const appVersion = pkg.version;
const buildTime = formatAtlanticTimestamp(new Date());
let gitCommit = 'unknown';
try {
	gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
	// Not a git checkout (or git unavailable): leave the fallback.
}

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			paths: { base },
			// Don't let SvelteKit auto-register the service worker. Its auto-registration
			// fires in dev too, as a `{ type: 'module' }` worker, which Chrome fails to
			// evaluate — the SW is only meant to run in the production build anyway. We
			// register it manually, prod-only, in src/routes/+layout.svelte. This flag only
			// suppresses the injected registration; the worker is still built.
			serviceWorker: { register: false }
		})
	],
	define: {
		__APP_VERSION__: JSON.stringify(appVersion),
		__BUILD_TIME__: JSON.stringify(buildTime),
		__GIT_COMMIT__: JSON.stringify(gitCommit)
	},
	test: {
		expect: { requireAssertions: true },
		// Scaffolding stage: the domain layer (and its tests) arrives with the first
		// game-logic TODO. Drop this once tests/domain/ is populated.
		passWithNoTests: true,
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
