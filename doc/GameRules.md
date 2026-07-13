---
name: GameRules
description: Rules specification for the game.
---

### Summary

Use a deck of N cards with no suits, just natural numbers from 1 to N.
(like the deck in [Rack-O](http://en.wikipedia.org/wiki/Rack-O), though this game is different and simpler)

* Steps:
    * Shuffle and deal N cards evenly to X players and a prize-pool called a "kitty".
    * For each round:
        * Reveal a card from the kitty. This is the 'prize card'.
        * Each player selects card, as a 'bid' in an auction, from his/her hand.
        * Bids are revealed: player with the highest bid wins points according to value of the prize card.
        * The bids and the prize card are discarded.

After all rounds, player with most points wins.

### Example

* Assume Deck is [1,2,3,4,5,6,7,8,9]. Two players: Alice and John.
* After dealing, let's assume:
    * John's hand is [2,4,9]
    * Alice's hand is [1,3,8]
    * kitty is [5,6,7]

* Round 1:
    * prize card is 5
    * John bids 4
    * Alice bids 8 
    * Alice wins 5 pts
    * cards [5,4,8] are discarded

* Round 2:
    * prize card is 6
    * John bids 9
    * Alice bids 1 
    * John wins 6 pts
    * cards [6,9,1] are discarded

* Round 3:
    * prize card is 7
    * John bids 2
    * Alice bids 3 
    * Alice wins 7 pts
    * cards [7,2,3] are discarded

* Game over: Alice wins (12 pts) over John (6 pts)

### Strategy

* Automated players might use a particular strategy. For example:
    * max strategy: always bid maximum-value card from hand
    * min strategy: always bid minimum-value card from hand
    * nearest strategy: always bid card from hand that is closest to the prize card 
    * yolo strategy: play random card from hand 

