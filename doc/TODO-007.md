
### TODO-007 [COMPLETE]

* in Config, for each player:
    * allow user to specify name (min-length: 4, max-length: 10)
    * allow user to choose strategy from list:
        * "Auto": assign randomly each game
        * "Min"
        * "Max"
        * "Next""
        * "Nearest"
        * "Hybrid"

* modify game play to reflect config settings above

* bump version to 0.1.7

Decisions taken while implementing:

* Only the **three computer players** are configurable — the human seat stays "You" (which the
  4-character minimum would reject anyway).
* An **Auto** seat is dealt a strategy that no seat was set to *by hand*, and Auto seats never
  duplicate each other. Two seats set to Min by hand are honoured as written: only Auto is
  constrained.
* **Duplicate names are allowed** — the scoreboard is by seat.
* A name that is too short (mid-typing, e.g. "Moz") is left on screen and flagged, but not
  saved: the last valid name for that seat stays. `maxlength` handles the long end.
