# Bids

A free, open-source app for **Bids**, a simple bidding card game: a suitless deck of the
numbers 1..N is dealt out to the players and a kitty; each round turns up a prize card
from the kitty, every player bids one card from their hand, and the highest bid takes the
prize card's points. Most points after the last round wins. See
[doc/GameRules.md](doc/GameRules.md) for the rules and [doc/SPEC.md](doc/SPEC.md) for the
project plan.

**Current status: scaffolding (TODO-001).** The app is an installable, offline-capable
PWA shell with a home page offering:

- **Play** — placeholder; the game itself is not implemented yet.
- **Config** — placeholder; deck size, player count, and AI strategies will live here.
- **About** — real: version, build time, and git commit of the running build.

## Running the app locally

### Prerequisites

- **Node.js 20.19+, 22.12+, or 24+** (an LTS line; the tooling does not support
  odd-numbered releases like Node 23) and npm.
- Any modern browser.

> macOS + Homebrew tip: `brew install node` (the unversioned formula tracks the latest
> release, which satisfies the range above).

### Development server

```sh
npm install
npm run dev            # http://localhost:5173
npm run dev -- --open  # same, but opens your browser
```

The dev server hot-reloads on every file change.

### Tests

```sh
npm test             # full suite, single run
npm run test:unit    # watch mode
npm run check        # typecheck (svelte-check)
```

There are no tests yet — the suite is wired up and passes vacuously (`passWithNoTests` in
`vite.config.ts`) until the domain layer lands. Per SPEC §9 the domain layer is the heart
of the project and is to be tested relentlessly; remove that flag with the first domain
test.

### Production build & PWA testing

```sh
npm run build        # static site in build/
npm run preview      # serve it at http://localhost:4173
```

The service worker (offline support) and install prompt only activate in the **production
build**, not the dev server.

## Project layout

The structure follows SPEC §7, mapped onto SvelteKit conventions (the same mapping the
sibling `forty-fives` app uses):

| SPEC §7 | This repo |
|---|---|
| `src/domain/` | `src/lib/domain/` — pure game logic, **zero UI dependencies** |
| `src/ui/` | `src/lib/ui/` + `src/routes/` — Svelte components (`/`, `/play`, `/config`, `/about`) |
| `src/assets/` | `src/lib/assets/` — avatars, and game data as JSON |
| `tests/` | `tests/domain/` |

## License

[Apache 2.0](LICENSE). Visual asset provenance is documented in [ASSETS.md](ASSETS.md).
