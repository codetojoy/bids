# Bids

A free, open-source app for **Bids**, a simple bidding card game: a suitless deck of the
numbers 1..N is dealt out to the players and a kitty; each round turns up a prize card
from the kitty, every player bids one card from their hand, and the highest bid takes the
prize card's points. Most points after the last round wins. See
[doc/GameRules.md](doc/GameRules.md) for the rules and [doc/SPEC.md](doc/SPEC.md) for the
project plan.

**Current status: a playable, configurable game.** The app is an installable, offline-capable
PWA:

- **Play** — a full game: the deck is dealt to you and three computer players (Mozart, Brahms
  and Chopin) plus the kitty. Each round shows the prize card, you bid a card from your hand,
  all four bids are revealed, and the highest takes the prize card's points. The game ends
  with the final standings.
- **Config** — three settings, saved on this device and nowhere else:
  - **Theme** — Cream (the warm default), Dark, or Tiger (orange on black).
  - **Deck size** — 20 to 60 cards, default 40. The deck is dealt evenly to the four players
    and the kitty, so the size sets the length of the game: 40 cards means 8 cards each and 8
    rounds; 20 means a quick 4-round game; 60 a long 12-round one. It applies to your next new
    game.
  - **Display strategy** — off by default. Turn it on and each opponent is named with the
    strategy it's playing: "Mozart (Min)", "Chopin (Nearest)".
- **About** — version, build time, and git commit of the running build.

Every new game deals the three computer players **a different strategy each, at random**, so no
two of them bid the same way and no two games are the same table:

| Strategy | How it bids |
|---|---|
| **Min** | The lowest card in hand — concede this prize, keep the ammunition. |
| **Max** | The highest card in hand — take this prize, whatever it costs later. |
| **Nearest** | The card closest in face value to the prize; ties go to the lower card. |
| **Hybrid** | Nearest when the prize is in the top half of the deck, Min otherwise. |
| **Next** | The next card in the hand as dealt — the original, deliberately trivial baseline. |

A strategy is a pure function of *its own hand, the prize, and the deck size* — it is never
shown another player's hand or bid, so it cannot cheat, and bids are genuinely simultaneous. A
new one is a single entry in `src/lib/domain/strategy.ts` and nothing else.

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

The suite tests the domain layer (SPEC §9: the UI is replaceable, the rules engine is not).
Beyond per-module tests it checks whole-game properties over seeded games, at every playable
deck size and with every strategy at the table: points are conserved (the final scores sum to
the kitty's face value), cards are conserved (every dealt card is bid exactly once), and every
game terminates in exactly `deckSize / 5` rounds with all hands empty.

One rules note worth knowing: because the deck is suitless and every card unique, two players
can never bid the same number — so there is no tie-break rule, and the domain throws if it
ever sees a duplicate bid. Final *scores* can tie, and a shared win is reported as such.

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
| `src/ui/` | `src/lib/ui/` + `src/routes/` — Svelte components (`/`, `/play`, `/config`, `/about`), the theme registry, and the `localStorage` settings |
| `src/assets/` | `src/lib/assets/` — avatars, and game data as JSON |
| `tests/` | `tests/domain/` + `tests/ui/` |

## License

[Apache 2.0](LICENSE). Visual asset provenance is documented in [ASSETS.md](ASSETS.md).
