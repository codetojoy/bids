
### TODO-008 [COMPLETE]

* Currently, when a player wins, the display is "Brahms2 wins with 42 points".Let's remove "with N points" from this display as it is somewhat redundant.
* In the display, add a celebratory emoji if the human won; use a handshake emoji if a computer player won.
* see forty-fives project for specific emojis

* bump version to 0.1.8

Decisions taken while implementing:

* Emojis follow forty-fives (`doc/TODO-061.md` there): 🎉 for the human, 🤝 — the post-game
  handshake, gracious rather than glum — for a computer. Emoji-first, as in the sibling.
* Dropping the score costs nothing: the final standings sit directly under the headline.
* **Ties** were not in the TODO but `gameWinners` returns a list, so the four lines are:
  `🎉 You win!` · `🤝 Brahms wins.` · `🎉 You tie with Brahms.` · `🤝 Brahms and Chopin tie.`
  A shared win is still a win, so the emoji turns on whether the human is *among* the winners.
* The headline lives in a pure `resultMessage()` (`src/lib/ui/result.ts`) because a tie cannot
  be produced by driving the app — the UI has no seed control — so it must be unit-testable.
* The emoji is decorative: `aria-hidden`, so a screen reader says "You win!", not "party
  popper You win!".

