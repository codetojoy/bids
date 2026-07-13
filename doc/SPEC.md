# Bids — Project Plan & Spec

A simple card-game app.

---

## 1. Project Overview

Build a free, open-source app that lets people play a no-frills card game.

See ./doc/GameRules.md for rules

### Non-goals

- No profit motive; no ads; no in-app purchases.
- No accounts or backend in early phases (privacy is a feature).

---

## 2. Goals & Constraints

| Constraint | Decision |
|---|---|
| **Cost to user** | Free |
| **Source** | Open source (Apache 2 license) |
| **Platforms** | web | 
| **UI polish** | "Decent" — not a for-profit app, but accessible and clean |
| **Developer background** | Senior backend engineer; new to mobile, UI, and game dev |

## 3. Tech Stack

### Phase A (PWA)

- **Framework:** SvelteKit (primary recommendation) or React + Vite (fallback if more documentation is desired)
- **Language:** TypeScript
- **PWA tooling:** Vite PWA plugin (service worker, manifest, offline cache)
- **Hosting:** GitHub Pages
- **Domain:** ~$15/year 
- **Letter, hidden-letter assets:** SVG, rendered inline
- **State:** In-memory; persisted to `localStorage` (settings, in-progress game)

---

## 4. Core Domain Model

* use a strategy pattern for various player stratgies:
    * minimum card
    * maximum card
    * nearest-to-prize-card 
    * hybrid of primitive strategies

## 5. Assets

* TBD

---

## 6. Publishing & Legal

### Phase A (PWA)

- Domain registration: ~$15/year.
- Hosting: GitHub Pages
- No app store involvement.
- Privacy policy: minimal — no accounts, no analytics, no network calls beyond loading the site.

### Licensing

- **Code:** Apache 2.0
- **Assets:** Use only CC0, MIT, or Apache-compatible assets. Document the license of every asset in `ASSETS.md`.

## 7. Repository Structure (proposed)

```
bids/
├── README.md
├── LICENSE                          # Apache 2
├── ASSETS.md                        # provenance of all visual assets
├── doc/
│   ├── rules/                       # rules documentation per variant
│   ├── design/                      # UI sketches, design decisions
│   └── ai-notes/                    # AI strategy notes
├── src/
│   ├── domain/                      # pure logic — no UI dependencies
│   │   ├── TBD
│   ├── ui/                          # framework-specific components
│   │   ├── components/
│   │   ├── routes/
│   │   └── styles/
│   ├── assets/
│   │   ├── cards//                   # SVG deck
│   └── app.ts                       # entry point
├── tests/
│   ├── domain/                      # exhaustive — every ranking, every renege case
│   └── e2e/
└── package.json
```

**Architectural principle:** The `domain/` directories must have **zero dependencies on the UI framework**. 

---

## 8. Immediate Next Steps

1. see doc/TODO-001.md ; there will be subsequent requests in this format

---

## 9. Notes for Claude Code

- Treat the `domain/` layer as the heart of the project. Test it relentlessly. The UI is replaceable; the rules engine is not.
- Prefer pure functions over classes for game logic. Game state should be immutable; transitions produce new states.
