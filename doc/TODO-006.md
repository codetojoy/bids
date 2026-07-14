
### TODO-006 [COMPLETE]

* implement these strategies for playing a round
    * "Min": play minimum card in hand 
    * "Max": play maximum card in hand 
    * "Random": play random card in hand 
    * "Nearest": play card in hand that is nearest to the prize card, using absolute value
    * "Hybrid":
        * use "Nearest" if prize card > N / 2, where N is deck size
        * use "Min" otherwise
* introduce new boolean config "Display strategy"
    * when enabled: in game play, display the strategy near the name of the player
        * e.g. "Mozart (Min)", "Chopin (Nearest)" 

* bump version to 0.1.6 (bump minor version)

Decisions taken while implementing:

* "Random" was **dropped** — the existing "Next" strategy stays and is listed alongside the
  others. So the five are Next, Min, Max, Nearest, Hybrid, and no strategy needs an `Rng`.
* "Nearest" breaks an equal distance (prize 20, holding 17 and 23) toward the **lower** card.
* Each new game deals the three computer seats a **distinct strategy at random**, from the
  game's own seed — so a seed still reproduces the whole table, and "Display strategy" has
  something worth displaying.
