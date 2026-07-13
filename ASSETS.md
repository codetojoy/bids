# Asset provenance

Per SPEC §6, every visual asset in this repository is listed here with its origin and
license. Only CC0/MIT/Apache-compatible assets are used. The third-party assets are the
two bundled font families (SIL OFL) and the six avatar SVGs (CC0); everything else is
original to this project.

| Asset | Origin | License |
|---|---|---|
| `static/fonts/lato-400.woff2`, `lato-400-italic.woff2`, `lato-700.woff2` | [Lato](https://fonts.google.com/specimen/Lato) by Łukasz Dziedzic; latin-subset woff2 files obtained via Google Fonts, self-hosted so the app makes no network calls (SPEC §6) | SIL Open Font License 1.1 |
| `static/fonts/lora-600.woff2`, `lora-400-italic.woff2` | [Lora](https://fonts.google.com/specimen/Lora) by Cyreal; latin-subset woff2 files obtained via Google Fonts, self-hosted | SIL Open Font License 1.1 |
| `src/lib/assets/favicon.svg`, `static/icon.svg` | Original Bids app icon (two fanned number cards), hand-written SVG | Apache 2.0 (project license) |
| `src/lib/assets/avatars/peep-*.svg` (6 files) | [Open Peeps](https://www.openpeeps.com/) by Pablo Stanley, rendered offline via the [DiceBear](https://www.dicebear.com/styles/open-peeps/) `open-peeps` style; each SVG embeds the license statement in its `<metadata>`. Copied from the sibling `forty-fives` project, where they were generated (see that repo's `ASSETS.md` for the full seed/option generation record) | CC0 1.0 (public domain) |

## Note on avatars

The avatars were generated **offline, once, at development time** — never at runtime,
never via `api.dicebear.com`, and the resulting static SVGs are committed. The shipped app
carries no generator library and makes no network calls (privacy, SPEC §6). They are
intended for the computer players' seats; keep them small and unobtrusive — the game is in
the cards, not the faces. Avatars are decorative: use `alt=""` + `aria-hidden`, with the
visible player name and strategy as the real identifiers.

## Note on the card deck

The deck in Bids is suitless — just the numbers 1..N — so there is no standard playing-card
deck to vendor. Card faces will be drawn programmatically as inline SVG (per SPEC §3), which
also gives sharper text scaling and larger, higher-contrast numerals. Record the provenance
here if that changes.
