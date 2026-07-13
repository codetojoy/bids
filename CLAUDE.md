# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A free, open-source app for **Bids**, a simple bidding card game played with a suitless deck
of the numbers 1..N: the deck is dealt evenly to the players and a kitty, each round turns up
a prize card from the kitty, every player bids one card from their hand, and the highest bid
wins the prize card's points. The rules are `doc/GameRules.md`; the authoritative project plan
is `doc/SPEC.md` — read both before making design decisions. Work items arrive as
`doc/TODO-*.md` files.

**Current state: one playable game (TODO-002).** `/play` deals a 1..40 deck to you and three
computer players (Mozart, Brahms, Chopin) plus the kitty — five piles of 8, so a game is 8
rounds — and plays through to a winner. Every computer seat uses the `nextCard` strategy (bid
the next card in the hand as dealt), a deliberately trivial baseline. Deck size, player names,
and strategy assignment are hard-coded in `DEFAULT_CONFIG` and become configurable later;
`/config` is still a placeholder, and nothing persists to `localStorage` yet.

**The tie invariant (confirmed with the human):** the deck is suitless and every card unique,
so two players can never bid the same number — there is no tie-break rule, and none should be
invented. `resolveRound` throws on a duplicate bid because it means the deal or a strategy is
broken. *Scores* can tie, so `gameWinners` returns a list.

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

`src/lib/domain/` is pure TypeScript game logic with **zero imports from Svelte, SvelteKit, or
anything UI** (SPEC §7). UI code (`src/routes/`, `src/lib/ui/`) calls into the domain, never
the reverse. Prefer pure functions over classes; `GameState` is immutable, plain JSON-able data
and every transition returns a new state (SPEC §9). Any module that touches `localStorage` must
be SSR-safe (guarded by `browser`) because all routes are prerendered by adapter-static.

Domain module map:

- `rng.ts` — seedable mulberry32; all randomness goes through an `Rng` so games are
  deterministic under test and reproducible from a seed
- `deck.ts` — `Card` is just a number (the deck is suitless); `buildDeck`, `shuffle`, and
  `deal`, which splits the deck into `playerCount + 1` equal piles (players + kitty) and throws
  rather than dropping cards if it doesn't divide evenly
- `strategy.ts` — the strategy pattern (SPEC §4). A `Strategy` is a pure
  `({ hand, prize }) => Card`; bids are simultaneous, so it never sees another player's bid.
  Only `nextCard` exists so far — min / max / nearest-to-prize / hybrid are added as new entries
  in `STRATEGIES` with no changes anywhere else
- `game-state.ts` — `startGame` and the `playRound(state, humanCard)` transition; validates and
  throws on an impossible move (a card the human doesn't hold, playing past the end)
- `scoring.ts` — `resolveRound` (highest bid wins), `standings`, `gameWinners`

Seat 0 is always the human (`HUMAN_ID`) and is the only seat with a `null` strategy.

### The random deal must not happen at prerender time

`/play` deals in `onMount`, not during component init, and renders "Dealing…" until then. All
routes are prerendered, so a game dealt during the static build would be baked into the HTML
and then contradicted by the game the client deals on hydration. Keep new randomness
client-side.

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

The domain layer is the heart of the project — test it relentlessly (SPEC §9); the UI is
replaceable, the rules engine is not. `tests/domain/` covers each module plus whole-game
properties over seeded games: **points are conserved** (the scores must sum to the kitty's face
value), **cards are conserved** (every dealt card is bid exactly once), and every game
terminates in exactly `kitty.length` rounds with all hands empty. Add to those invariants
rather than only testing new functions in isolation.

## Constraints worth remembering

- Privacy first: no accounts, no analytics, no network calls beyond loading the site. State
  persists only to `localStorage` (SPEC §1, §6).
- Accessibility: large tap targets (≥48px), high contrast, respect OS font scaling.
- License is Apache 2.0. Any new visual asset must be CC0/MIT/Apache-compatible and recorded
  in `ASSETS.md` with its provenance (third-party today: the Lato/Lora fonts, SIL OFL, and the
  six CC0 Open Peeps avatar SVGs).
