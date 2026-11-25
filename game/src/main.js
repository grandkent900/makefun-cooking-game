// main.js — the game itself: the loop, the state machine and every action.
// It wires the kitchen, the ticket rail, the renderer and the input together
// and owns the score, the combo, lives and the shift clock.

import { CANVAS_H, CANVAS_W, SHIFT_SECONDS, START_LIVES } from './config.js';
import { OrderRail, resetOrderIds } from './orders.js';
import { Kitchen } from './kitchen.js';
import { drawGame, drawGameOver, drawTitle } from './render.js';
import { actionForClick, actionForKey, canvasPoint } from './input.js';
import { shotFor } from './shots.js';
import { hashSeed, mulberry32 } from './rng.js';
import { ensureAudio, setSizzle, sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const params = new URLSearchParams(window.location.search);
const seedText = params.get('seed') || 'sizzle-thyme';
const shotName = params.get('shot') || '';

function newRun() {
  resetOrderIds();
  const rng = mulberry32(hashSeed(seedText));
  return {
    phase: 'title',
    rng,
    rail: new OrderRail(rng),
    kitchen: new Kitchen(),
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: START_LIVES,
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    served: 0,
    lost: 0,
    best: 0,
    popups: [],
    toast: '',
    toastAt: 0,
    paused: false,
    lastTickSecond: -1,
  };
}

let state = newRun();

function say(message) {
  state.toast = message;
  state.toastAt = state.elapsed;
}

function servePlate() {
  const kitchen = state.kitchen;
  if (kitchen.plate.length === 0) {
    say('The plate is empty — stack a recipe first.');
    return;
  }
  const order = state.rail.matchPlate(kitchen.plateKeys());
  if (!order) {
    say('That is not any ticket on the board. Keep stacking, or bin the plate.');
    return;
  }
  const gained = state.rail.scoreServe(order, state.elapsed, state.combo);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.score += gained;
  state.served += 1;
  state.rail.remove(order);
  kitchen.passPlate = kitchen.plate.slice();
  kitchen.clearPlate();
  kitchen.servedFlash = 1.2;
  state.popups.push({ label: `+${gained}`, x: 1136, y: 566, life: 1 });
  say(`${order.recipe.name} served — +${gained}!`);
  sfx.serve();
}

function doAction(a) {
  const kitchen = state.kitchen;
  switch (a.action) {
    case 'crate': {
      if (kitchen.takeFromCrate(a.id)) sfx.pickup();
      else say('Your hands are full — place something down first.');
      break;
    }
    case 'board': {
      const result = kitchen.tapBoard(state.elapsed);
      if (result === 'placed') sfx.place();
      else if (result === 'chop') sfx.chop(kitchen.board ? kitchen.board.taps : 0);
      else if (result === 'chopped') { sfx.chop(2); say('Chopped! Pick it up and plate it.'); }
      else if (result === 'picked') sfx.pickup();
      else say('Nothing to chop — bring a tomato, lettuce or onion.');
      break;
    }
    case 'grill': {
      const result = kitchen.tapGrill(a.slot ?? 0, state.elapsed);
      if (result === 'placed') { sfx.grillStart(); say('Patty on the grill — watch it, it burns!'); }
      else if (result === 'picked') sfx.pickup();
      else if (result === 'picked-burnt') { sfx.burnt(); say('Burnt patty — bin it.'); }
      else say('The grill takes raw patties only.');
      break;
    }
    case 'plate': {
      const result = kitchen.tapPlate();
      if (result === 'plated') sfx.place();
      else if (result === 'picked') sfx.pickup();
      else if (kitchen.plate.length >= 4) say('The plate is full.');
      else say('That needs chopping or grilling first.');
      break;
    }
    case 'clear-plate': {
      if (kitchen.binPlate()) say('Plate cleared.');
      break;
    }
    case 'bin': {
      if (kitchen.binHands()) say('Binned.');
      else if (kitchen.binPlate()) say('Plate cleared.');
      else say('Nothing to bin.');
      break;
    }
    case 'serve': servePlate(); break;
    case 'pause': state.paused = !state.paused; break;
    case 'restart': restartShift(); break;
    default: break;
  }
}

function restartShift() {
  const best = Math.max(state.best, state.score);
  state = newRun();
  state.best = best;
  state.phase = 'playing';
  state.toast = 'New shift — first ticket coming up!';
}

function startShift() {
  state.phase = 'playing';
  state.elapsed = 0;
  sfx.newOrder();
}

function tick(dt) {
  if (state.phase !== 'playing' || state.paused) return;
  state.elapsed += dt;
  state.shiftLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

  const { spawned, expired } = state.rail.update(dt, state.elapsed);
  for (const order of spawned) {
    void order;
    sfx.newOrder();
    say(`New ticket: ${state.rail.orders[state.rail.orders.length - 1].recipe.name}`);
  }
  for (const order of expired) {
    state.lives -= 1;
    state.lost += 1;
    state.combo = 0;
    sfx.expire();
    say(`Ticket #${order.id} ${order.recipe.name} walked out! A life lost.`);
  }

  const cue = state.kitchen.updateGrill(state.elapsed);
  if (cue === 'burnt') {
    sfx.burnt();
    say('A patty burnt on the grill!');
  }
  setSizzle(state.kitchen.grillCooking());
  state.kitchen.update(dt);

  // Tick sound and toast fade in the last ten seconds of the most urgent ticket.
  const urgent = state.rail.mostUrgent(state.elapsed);
  if (urgent) {
    const left = state.rail.timeLeft(urgent, state.elapsed);
    const whole = Math.ceil(left);
    if (left <= 10 && whole !== state.lastTickSecond) {
      state.lastTickSecond = whole;
      sfx.tick();
    }
  }
  for (const p of state.popups) {
    p.life -= dt;
    p.y -= dt * 30;
  }
  state.popups = state.popups.filter((p) => p.life > 0);
  if (state.toast && state.elapsed - state.toastAt > 4) state.toast = '';

  if (state.lives <= 0 || state.shiftLeft <= 0) {
    state.phase = 'gameover';
    state.best = Math.max(state.best, state.score);
    setSizzle(false);
    sfx.gameOver();
  }
}

function draw() {
  if (state.phase === 'title') drawTitle(ctx, state.best);
  else if (state.phase === 'gameover') drawGameOver(ctx, state);
  else drawGame(ctx, state);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  tick(dt);
  draw();
  requestAnimationFrame(frame);
}

canvas.addEventListener('pointerdown', (event) => {
  ensureAudio();
  const p = canvasPoint(canvas, event);
  if (state.phase === 'title') { startShift(); return; }
  if (state.phase === 'gameover') { restartShift(); return; }
  if (state.paused) {
    const a = actionForKey('p');
    doAction(a);
    return;
  }
  doAction(actionForClick(p.x, p.y));
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  ensureAudio();
  const key = event.key;
  if (state.phase === 'title' && (key === 'Enter' || key === ' ')) { startShift(); return; }
  if (state.phase === 'gameover' && (key === 'r' || key === 'R' || key === 'Enter')) { restartShift(); return; }
  if (state.phase !== 'playing') return;
  if (key === ' ') event.preventDefault();
  doAction(actionForKey(key));
});

// A read-only hook for automated playtests: the current phase, score and
// kitchen state. It never mutates anything and is not part of the game.
window.__sizzle = {
  snapshot() {
    return {
      phase: state.phase,
      score: state.score,
      combo: state.combo,
      lives: state.lives,
      elapsed: Math.round(state.elapsed * 10) / 10,
      orders: state.rail.orders.map((o) => ({ id: o.id, recipe: o.recipe.id, left: Math.round(state.rail.timeLeft(o, state.elapsed)) })),
      hands: state.kitchen.hands,
      plate: state.kitchen.plateKeys(),
      board: state.kitchen.board,
      grill: state.kitchen.grill.map((s) => (s ? { id: s.item.id, state: s.item.state } : null)),
    };
  },
};

// Screenshot mode: render one frozen, staged scene and stop — no clock, no
// animation, so the same ?shot= always renders the same pixels.
const staged = shotName ? shotFor(shotName) : null;
if (staged) {
  state = staged;
  draw();
  document.title = `Sizzle & Thyme — ${shotName}`;
} else {
  document.title = 'Sizzle & Thyme — a cozy kitchen rush';
  requestAnimationFrame(frame);
}
