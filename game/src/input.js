// input.js — mouse and keyboard: turn clicks and keys into kitchen actions.
// Hit-testing reuses the same rectangles render.js draws, so what you see
// is what you can click.

import { CRATE_ORDER } from './config.js';
import { layout } from './render.js';

function pointIn(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

// Translate a click on the canvas into a game action name plus its target.
// Coordinates arrive already scaled to the canvas's own 1280x800 space.
export function actionForClick(x, y) {
  const L = layout();
  for (const crate of L.crates) {
    if (pointIn(x, y, crate)) return { action: 'crate', id: crate.id };
  }
  if (pointIn(x, y, L.trash)) return { action: 'bin' };
  if (pointIn(x, y, L.board)) return { action: 'board' };
  for (let i = 0; i < L.grillSlots.length; i += 1) {
    if (pointIn(x, y, L.grillSlots[i])) return { action: 'grill', slot: i };
  }
  if (pointIn(x, y, L.grill)) return { action: 'grill', slot: 0 };
  if (pointIn(x, y, L.plate)) return { action: 'plate' };
  if (pointIn(x, y, L.serve)) return { action: 'serve' };
  if (pointIn(x, y, L.clearPlate)) return { action: 'clear-plate' };
  return { action: 'none' };
}

// Map a key press to an action. Keys 1-6 pick pantry ingredients in crate
// order; the rest are the station shortcuts shown on the pass.
export function actionForKey(key) {
  const k = key.toLowerCase();
  if (k >= '1' && k <= '6') {
    return { action: 'crate', id: CRATE_ORDER[Number(k) - 1] };
  }
  switch (k) {
    case 'c': return { action: 'board' };
    case 'g': return { action: 'grill', slot: 0 };
    case ' ': case 'enter': return { action: 'serve' };
    case 'b': return { action: 'bin' };
    case 'p': return { action: 'pause' };
    case 'r': return { action: 'restart' };
    default: return { action: 'none' };
  }
}

// Scale a pointer event's client coordinates into canvas coordinates,
// accounting for the canvas being letterboxed to fit the window.
export function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}
