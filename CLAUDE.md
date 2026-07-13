# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A free, open-source app for **Bids**, a simple bidding card game played with a suitless deck
of the numbers 1..N: the deck is dealt evenly to the players and a kitty, each round turns up
a prize card from the kitty, every player bids one card from their hand, and the highest bid
wins the prize card's points. The rules are `doc/GameRules.md`; the authoritative project plan
is `doc/SPEC.md` — read both before making design decisions. Work items arrive as
`doc/TODO-*.md` files.

**Current state: scaffolding only (TODO-001).** SvelteKit PWA shell, the warm cream/rust
theme, and a home page with Play (placeholder), Config (placeholder), and About (real build
info). No domain layer yet — no deck, no game state, no strategies.

The tech stack, styling, project layout, and PWA plumbing were modelled on the sibling project
at `../forty-fives`, which is **read-only reference material**: never modify anything in it.

## Node version (required)

Node must satisfy the `engines` range in `package.json` (currently `^20.19 || ^22.12 || >=24`,
mirroring `@sveltejs/vite-plugin-svelte` — note it excludes the odd-numbered Node 23).
`engine-strict=true` is set, so a non-matching Node fails fast — that is deliberate; do not
bypass it with `--force` or by relaxing `.npmrc`, and do not loosen the `engines` range.

## Commands

```sh
npm run dev      # dev server at http://localhost:5173 (hot reload)
npm test         # full Vitest suite, single run
npm run test:unit # watch mode
npm run check    # svelte-check / typecheck
npm run build    # static production build into build/
npm run preview  # serve the build at http://localhost:4173
```

The service worker and PWA install flow only work in the production build (`build` +
`preview`), never in the dev server.

## Architecture

### Domain purity (the load-bearing rule)

`src/lib/domain/` is to be pure TypeScript game logic with **zero imports from Svelte,
SvelteKit, or anything UI** (SPEC §7). UI code (`src/routes/`, `src/lib/ui/`) calls into the
domain, never the reverse. Prefer pure functions over classes; game state is immutable and
plain JSON-able data, and transitions produce new states (SPEC §9). Any module that touches
`localStorage` must be SSR-safe (guarded by `browser`) because all routes are prerendered by
adapter-static.

Player strategies use the strategy pattern (SPEC §4): minimum card, maximum card,
nearest-to-prize-card, and hybrids of the primitives. Randomness should go through a seedable
RNG so games are deterministic under test.

### Layout mapping

SPEC §7's proposed structure is mapped onto SvelteKit: `src/domain/` → `src/lib/domain/`,
`src/ui/` → `src/lib/ui/` + `src/routes/`, `src/assets/` → `src/lib/assets/`. Routes: `/`
(home), `/play`, `/config`, `/about`. Tests live in `tests/domain/` (the `tests/**` include is
wired into `vite.config.ts`). Svelte 5 **runes mode** is forced project-wide in
`vite.config.ts`. The service worker precaches `prerendered` routes — keep that import in sync
if routes are added.

`vite.config.ts` injects `__APP_VERSION__` (from `package.json` — bump it there),
`__BUILD_TIME__`, and `__GIT_COMMIT__` at build time; the `/about` page displays them.
`BASE_PATH=/bids` (`npm run build:gh-pages`) builds for the GitHub Pages project subpath, so
all internal links must use `base` from `$app/paths`.

### Testing

`vite.config.ts` currently sets `passWithNoTests: true` so the empty suite is green during
scaffolding. **Remove that flag with the first domain test.** The domain layer is the heart of
the project — test it relentlessly (SPEC §9); the UI is replaceable, the rules engine is not.

## Constraints worth remembering

- Privacy first: no accounts, no analytics, no network calls beyond loading the site. State
  persists only to `localStorage` (SPEC §1, §6).
- Accessibility: large tap targets (≥48px), high contrast, respect OS font scaling.
- License is Apache 2.0. Any new visual asset must be CC0/MIT/Apache-compatible and recorded
  in `ASSETS.md` with its provenance (third-party today: the Lato/Lora fonts, SIL OFL, and the
  six CC0 Open Peeps avatar SVGs).
