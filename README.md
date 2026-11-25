# Sizzle & Thyme — a cozy kitchen rush

[![Sizzle & Thyme](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/grandkent900/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/grandkent900/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original cooking game that runs offline in a desktop browser.
Tickets land on the order board, you chop on the board, grill patties on
the stove, stack dishes on the plate and serve them before the clock runs
out. Three lives, a 150-second shift, and a lunch rush that keeps getting
faster.

## How to play

- **Pantry (click or keys 1–6):** pick up an ingredient.
- **Chopping board (click or C):** place a tomato, lettuce or onion, tap
  three times to chop it, click again to pick it up.
- **Stove (click or G):** lay a raw patty on a burner; it grills in six
  seconds and burns six seconds later. Click to lift it off.
- **Plate (click):** stack prepared items into a dish. Click with empty
  hands to lift the top item back off.
- **SERVE (click or SPACE):** serve a finished plate that matches a ticket
  on the board. The tip shrinks as the ticket's timer runs down, and a
  clean streak builds a combo.
- **Bin (click or B):** discard what you are holding, or clear the plate.
- **P** pause, **R** restart.

## The menu

| Dish | Needs |
| --- | --- |
| Garden Salad | chopped tomato + chopped lettuce |
| Classic Burger | bun + grilled patty + chopped lettuce |
| Cheesy Melt | bun + grilled patty + cheddar |
| Sunrise Stack | bun + grilled patty + chopped onion + cheddar |

A ticket that expires costs a life. Serve fast, keep the combo alive, and
the rush pays better.

## Play it

Serve `game/` with any static server and open `game/index.html` — no build
step, no network requests, all art drawn in canvas and all sound
synthesised with WebAudio.

- `?seed=<text>` — the same seed deals the same tickets in the same order.
- `?shot=cover|play|rush|serve` — frozen, staged scenes used for the
  screenshots.

## Layout

- `game/index.html` — the page, one canvas, one module script.
- `game/src/config.js` — recipes, timings, scores and the palette.
- `game/src/rng.js` — the seeded random generator.
- `game/src/orders.js` — the ticket rail: spawning, deadlines, scoring.
- `game/src/kitchen.js` — the stations: crates, board, grill, plate, bin.
- `game/src/render.js` — all canvas drawing, including the food art.
- `game/src/input.js` — mouse and keyboard, hit-tested on the drawn layout.
- `game/src/audio.js` — synthesised sound effects (WebAudio, no files).
- `game/src/shots.js` — the staged screenshot scenes.
- `game/src/main.js` — the loop, the state machine and every action.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`.

Built for the make.fun bounty
[best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137).
MIT License.
