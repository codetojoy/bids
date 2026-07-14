# Brainstorm: user-written strategies

Can players write their own computer-player strategy — in TypeScript — without opening
an obvious security hole? A scoping note, cross-checked against the codebase. Nothing is
implemented; this is a plan to react to.

**Verdict up front.** The interface idea does not work as a safety mechanism: *types are
erased at runtime*, so "it implements `Strategy`" constrains the function's **shape** and
says nothing about what its body **does**. A perfectly conforming
`({ hand, prize }) => Card` can also call `fetch`, rewrite the DOM, or loop forever.
Safety comes from **isolation**, not from typing. The good news is that this app's threat
model is unusually kind, and that the domain layer already does two of the three things
that matter.

---

## 1. The threat model — and the one line that actually matters

Bids is a static, offline PWA: no accounts, no backend, no analytics, nothing on the
device worth stealing (a theme and a deck size in `localStorage`). So:

- **A user running their own strategy is not a security event.** They already have that
  authority — it's a DevTools console with extra steps. Nothing they can do to themselves
  through a strategy is worse than what they can do by opening the debugger.
- **The risk arrives with *sharing*.** The moment a strategy can be pasted in from a
  friend, a forum, or a QR code, untrusted code runs on someone else's device with our
  origin's privileges. That is the line the whole design has to be built around.

If strategies are strictly local and never importable, most of this document is optional.
If they are shareable — and they will want to be, because "my bot beat Mozart" is the
entire fun — then the following harms are real:

| Harm | What it looks like here |
|---|---|
| **Exfiltration** | `fetch` / `sendBeacon` / an `<img>` with a query string. Also breaks the app's "no network calls" promise (SPEC §1) — the privacy claim in the README becomes false. |
| **Persistence** | A stored strategy runs on every page load, forever, unnoticed. |
| **UI phishing** | DOM access lets it draw a convincing "enter your email to save your bot" panel. |
| **Denial of service** | `while (true) {}` freezes the tab; a big allocation loop kills it. |
| **Cheating** | A strategy that can see other hands wins trivially — a *game* harm, not a browser one, and the one users will actually hit. |

## 2. Why "just check it implements the interface" fails

TypeScript's types exist only at compile time. To run user TypeScript at all you must
strip the types (Sucrase, esbuild-wasm) or compile them (the full `typescript` package,
several MB); either way what executes is JavaScript with the types gone. Even a *full*
type-check tells you the signature matches — never that the body is pure. There is no type
in TypeScript that means "performs no side effects."

What you *can* enforce at runtime is the **contract**, which is a different and useful
thing:

- it returns a number;
- that number is a card **currently in that player's hand**;
- it returns within a time budget.

That is worth doing regardless of sandboxing (§4), but it is a correctness check, not a
security boundary. A strategy that exfiltrates your storage and *then* returns a legal card
passes it perfectly.

## 3. Isolation options, cheapest first

### A. A declarative strategy builder — no code at all (recommended first step)

Users compose a strategy from primitives rather than writing code: *"bid the lowest card
above the prize; if I have none, bid my minimum"*. The app evaluates that structure itself,
so there is **no execution of user code anywhere** — zero attack surface, and strategies
share as plain JSON that can be validated field by field like any other untrusted blob
(the same discipline `normalizeSettings` already uses).

This sounds like a cop-out, but Bids is a small game: a bid is one card chosen from a hand
given one prize card. The primitives in SPEC §4 (min / max / nearest-to-prize / hybrid),
plus thresholds and a few conditionals, plausibly cover most of the interesting space. It
is the only option on this list with nothing to get wrong.

### B. Sandboxed iframe + Worker — for real code

The classic pattern, and the right one if arbitrary code is a hard requirement:

- Run the strategy in an `<iframe sandbox="allow-scripts">` built with `srcdoc`. That gives
  it an **opaque origin**, so it cannot reach our `localStorage`, our cookies, or our DOM —
  those are same-origin privileges it no longer has.
- Talk to it over `postMessage` only: send `{ hand, prize }`, receive a card.
- Put the strategy in a **Worker** inside the frame, so a runaway loop is killable —
  `worker.terminate()` on a timeout. This is the only reliable answer to `while (true)`.
- Add `<meta http-equiv="Content-Security-Policy" content="connect-src 'none'; ...">` inside
  the frame to kill exfiltration. It has to be a `<meta>` tag rather than a real header
  because **GitHub Pages cannot set response headers** — a genuine constraint of our
  hosting (see `doc/DEPLOY.md`).

The wrinkle: evaluating the code needs `unsafe-eval` in that frame's CSP. That is
acceptable *only* because the frame is a throwaway opaque origin containing nothing — but
it must never be granted to the main document.

### C. QuickJS (WASM) — the strong version

Run the strategy inside a JavaScript engine compiled to WASM. It has **no ambient
authority at all**: the sandbox gets exactly the functions we hand it, so `fetch`,
`Math.random`, and `Date` simply do not exist unless we pass them. It supports fuel /
interrupt limits, so CPU and memory bounds are *enforced* rather than hoped for, and it
works offline. Cost: a few hundred KB of WASM, and a more complex build.

### D. AST denylisting — do not do this

Parsing the code and rejecting `fetch`, `eval`, `import` &c. reads like security and isn't:
`globalThis["fe" + "tch"]` walks straight through it, and the history of such filters is a
history of bypasses. An AST **allowlist** (only these node types; no member access to
unknown identifiers) is genuinely defensible for functions this small — but at that point
you have designed a small restricted language, and you may as well have built option A and
gotten a nicer UI for free.

## 4. What the domain should do regardless — and mostly already does

Two of these exist today and should be understood as *load-bearing*, not incidental:

1. **Never trust the returned card.** `playRound` already throws if a strategy bids a card
   it does not hold (`src/lib/domain/game-state.ts`). Today that catches a buggy strategy;
   with user code it becomes a security control. Keep it, and pass **frozen copies** of the
   hand so a strategy cannot mutate game state through its arguments.
2. **Keep the strategy's inputs minimal — this is what makes cheating structurally
   impossible.** Our `Strategy` is `({ hand, prize }) => Card`
   (`src/lib/domain/strategy.ts`): it is never given `GameState`, so it *cannot* see another
   player's hand or bid, no matter what its body does. That is worth defending as a rule
   rather than treating as a happy accident. Bids are simultaneous; the type enforces it.
3. **If a strategy wants randomness, hand it a seeded `Rng`** rather than letting it reach
   for `Math.random`. Games stay reproducible from a seed, which is what makes the
   whole-game property tests (points conserved, cards conserved, termination) work — and
   those tests would be exactly how we'd validate a user strategy before letting it play.

## 5. Recommendation

1. **Ship the declarative builder (A) first.** It delivers the payoff — *my bot beat
   Mozart* — with no sandbox to get wrong, and shares safely as validated JSON.
2. **Treat arbitrary TypeScript as a later, opt-in "advanced" tier.** If it is built, use
   (B): sandboxed iframe + Worker + `connect-src 'none'` + a hard timeout.
3. **Never auto-run an imported strategy.** Show the source, require explicit consent, and
   do not execute anything on page load that arrived from outside the device.
4. **Be honest in the UI.** Strip types with something small (Sucrase) rather than shipping
   the whole compiler, and do not let the editor's green checkmark imply "this code is
   safe" — it means "this code type-checks."

## 6. Open questions for the human

1. **Are strategies shareable?** If they are strictly local-only and never importable, the
   sandbox is largely optional and this gets much cheaper. If they are shareable, it is not
   optional. This single answer drives everything else.
2. **Code, or a builder?** Is the appeal *writing TypeScript*, or *making a bot that wins*?
   If it's the latter, option A is a better product and a safer one.
3. **Does a user strategy have to survive a reload?** Persisting it means it auto-runs; not
   persisting it means an evening's work vanishes. This is where the persistence harm lives.
4. **Do custom strategies play only against the human, or can they be shared into someone
   else's game?** The latter turns a single-player app into an untrusted-code distribution
   channel, which is a much bigger commitment than it looks.
