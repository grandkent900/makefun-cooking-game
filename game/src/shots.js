// shots.js — staged scenes for screenshots. `?shot=cover` (and play, rush,
// serve) builds a fixed, deterministic kitchen state and freezes the clock,
// so a screenshot is a real render of the game's own code at a chosen moment.
// Every scene is built from the same seeded generator as live play.

import { RECIPES } from './config.js';
import { OrderRail, makeOrder, resetOrderIds } from './orders.js';
import { Kitchen } from './kitchen.js';
import { hashSeed, mulberry32 } from './rng.js';

function stagedState(seedText, setup) {
  resetOrderIds();
  const rng = mulberry32(hashSeed(seedText));
  const kitchen = new Kitchen();
  const rail = new OrderRail(rng);
  const state = {
    phase: 'playing',
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: 3,
    elapsed: 0,
    shiftLeft: 150,
    served: 0,
    lost: 0,
    best: 0,
    popups: [],
    toast: '',
    paused: false,
    kitchen,
    rail,
  };
  setup(state, rng);
  return state;
}

function addTicket(state, recipeId, deadline, elapsed, bornAt) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const order = makeOrder(recipe, deadline, bornAt);
  order.expiresAt = elapsed + deadline;
  state.rail.orders.push(order);
  return order;
}

// The cover: a full kitchen at the height of the rush — four tickets on the
// board, every crate stocked, a burger mid-assembly on the plate, a finished
// salad waiting on the pass, and the shift clock ticking.
export function shotCover() {
  return stagedState('sizzle-cover', (state) => {
    state.score = 1240;
    state.combo = 3;
    state.bestCombo = 3;
    state.elapsed = 62;
    state.shiftLeft = 88;
    state.served = 7;
    addTicket(state, 'classic-burger', 38, 62, 40);
    addTicket(state, 'garden-salad', 24, 62, 46);
    addTicket(state, 'cheesy-melt', 47, 62, 55);
    addTicket(state, 'sunrise-stack', 18, 62, 58);
    // A burger mid-assembly: bun and cooked patty on, lettuce still to come.
    state.kitchen.plate = [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'cooked' },
    ];
    // A patty sizzling on the stove, one burner free.
    state.kitchen.grill[0] = {
      item: { id: 'patty', state: 'raw' },
      cookedAt: 62 + 3,
      burntAt: 62 + 9,
    };
    // Chopped lettuce waiting on the board.
    state.kitchen.board = { item: { id: 'lettuce', state: 'chopped' }, taps: 3 };
    // A finished salad already on the pass, ready to serve.
    state.kitchen.passPlate = [
      { id: 'tomato', state: 'chopped' },
      { id: 'lettuce', state: 'chopped' },
    ];
    state.kitchen.hands = { id: 'tomato', state: 'chopped' };
    state.toast = 'Ticket #2 is almost out of time — serve it!';
  });
}

// Early play: one ticket, a tomato half-chopped, the kitchen still calm.
export function shotPlay() {
  return stagedState('sizzle-play', (state) => {
    state.score = 100;
    state.combo = 1;
    state.bestCombo = 1;
    state.elapsed = 18;
    state.shiftLeft = 132;
    state.served = 1;
    addTicket(state, 'garden-salad', 44, 18, 8);
    state.kitchen.board = { item: { id: 'tomato', state: 'raw' }, taps: 2 };
    state.kitchen.hands = { id: 'lettuce', state: 'raw' };
    state.toast = 'Chop the tomato — three taps on the board.';
  });
}

// The rush: four tickets, two nearly out of time, a patty about to burn.
export function shotRush() {
  return stagedState('sizzle-rush', (state) => {
    state.score = 2680;
    state.combo = 5;
    state.bestCombo = 5;
    state.elapsed = 118;
    state.shiftLeft = 32;
    state.served = 16;
    state.lost = 1;
    addTicket(state, 'sunrise-stack', 9, 118, 96);
    addTicket(state, 'classic-burger', 7, 118, 100);
    addTicket(state, 'cheesy-melt', 31, 118, 108);
    addTicket(state, 'garden-salad', 26, 118, 112);
    state.kitchen.plate = [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'cooked' },
      { id: 'onion', state: 'chopped' },
    ];
    state.kitchen.grill[0] = {
      item: { id: 'patty', state: 'cooked' },
      cookedAt: 112,
      burntAt: 118 + 1,
    };
    state.kitchen.grill[1] = {
      item: { id: 'patty', state: 'raw' },
      cookedAt: 118 + 2,
      burntAt: 118 + 8,
    };
    state.kitchen.hands = { id: 'cheese', state: 'raw' };
    state.toast = 'Two tickets under ten seconds — move!';
  });
}

// The serve: a finished burger on the plate, SERVE lit, score popping.
export function shotServe() {
  return stagedState('sizzle-serve', (state) => {
    state.score = 1450;
    state.combo = 4;
    state.bestCombo = 4;
    state.elapsed = 74;
    state.shiftLeft = 76;
    state.served = 8;
    addTicket(state, 'classic-burger', 33, 74, 52);
    addTicket(state, 'garden-salad', 41, 74, 60);
    state.kitchen.plate = [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'cooked' },
      { id: 'lettuce', state: 'chopped' },
    ];
    state.kitchen.passPlate = [
      { id: 'tomato', state: 'chopped' },
      { id: 'lettuce', state: 'chopped' },
    ];
    state.popups = [{ label: '+170', x: 1136, y: 566, life: 1 }];
    state.toast = 'A Classic Burger, right on time. Serve it!';
  });
}

export function shotFor(name) {
  switch (name) {
    case 'cover': return shotCover();
    case 'play': return shotPlay();
    case 'rush': return shotRush();
    case 'serve': return shotServe();
    default: return null;
  }
}
