// kitchen.js — the stations: crates, chopping board, grill, plate and bin.
// The kitchen holds one item per station slot and the player's hands. Every
// action here is a pure state change; rendering and sound live elsewhere.

import {
  CHOP_TAPS,
  BURN_AFTER_SECONDS,
  GRILL_SECONDS,
  INGREDIENTS,
  plateKey,
} from './config.js';

// An item the player or a station holds: { id, state } where state is
// 'raw' | 'chopped' | 'cooked' | 'burnt'.
export function rawItem(ingredientId) {
  return { id: ingredientId, state: 'raw' };
}

export function canChop(item) {
  return item && item.state === 'raw' && INGREDIENTS[item.id].prep === 'chop';
}

export function canGrill(item) {
  return item && item.state === 'raw' && INGREDIENTS[item.id].prep === 'grill';
}

export function canPlate(item) {
  if (!item || item.state === 'burnt') return false;
  // Bun and cheese plate as they are; everything else must be chopped or grilled.
  return item.state !== 'raw' || INGREDIENTS[item.id].prep === 'none';
}

export class Kitchen {
  constructor() {
    this.hands = null; // the item the player carries, or null
    this.board = null; // { item, taps } on the chopping board
    this.grill = [null, null]; // two grill slots: { item, cookedAt, burntAt }
    this.plate = []; // stacked plated items, bottom first
    this.passPlate = null; // a finished dish waiting on the pass (shown, not held)
    this.servedFlash = 0; // seconds left on the serve sparkle
    this.chopFlash = 0;
  }

  takeFromCrate(ingredientId) {
    if (this.hands) return false;
    this.hands = rawItem(ingredientId);
    return true;
  }

  // Tap the board: place a choppable item, chop it, or pick the chopped one up.
  tapBoard(nowSeconds) {
    if (!this.board && this.hands && canChop(this.hands)) {
      this.board = { item: this.hands, taps: 0 };
      this.hands = null;
      return 'placed';
    }
    if (this.board && this.hands === null && this.board.item.state === 'chopped') {
      this.hands = this.board.item;
      this.board = null;
      return 'picked';
    }
    if (this.board && this.board.item.state === 'raw') {
      this.board.taps += 1;
      this.chopFlash = 0.25;
      if (this.board.taps >= CHOP_TAPS) {
        this.board.item.state = 'chopped';
        return 'chopped';
      }
      return 'chop';
    }
    return 'noop';
  }

  // Tap a grill slot: lay a raw patty down, or lift a cooked one off.
  // A burnt patty comes off too — the player must bin it.
  tapGrill(slot, nowSeconds) {
    const held = this.grill[slot];
    if (!held && this.hands && canGrill(this.hands)) {
      this.grill[slot] = {
        item: this.hands,
        cookedAt: nowSeconds + GRILL_SECONDS,
        burntAt: nowSeconds + GRILL_SECONDS + BURN_AFTER_SECONDS,
      };
      this.hands = null;
      return 'placed';
    }
    if (held && this.hands === null) {
      this.hands = held.item;
      this.grill[slot] = null;
      return held.item.state === 'burnt' ? 'picked-burnt' : 'picked';
    }
    return 'noop';
  }

  // Advance grill timers: raw -> cooked at cookedAt, cooked -> burnt at burntAt.
  // Returns 'cooked' | 'burnt' | null for sound cues.
  updateGrill(nowSeconds) {
    let cue = null;
    for (const slot of this.grill) {
      if (!slot) continue;
      if (slot.item.state === 'raw' && nowSeconds >= slot.cookedAt) {
        slot.item.state = 'cooked';
        cue = 'cooked';
      } else if (slot.item.state === 'cooked' && nowSeconds >= slot.burntAt) {
        slot.item.state = 'burnt';
        cue = 'burnt';
      }
    }
    return cue;
  }

  grillCooking() {
    return this.grill.some((s) => s && s.item.state === 'raw');
  }

  grillProgress(slot, nowSeconds) {
    const held = this.grill[slot];
    if (!held) return 0;
    if (held.item.state === 'cooked') return 1;
    if (held.item.state === 'burnt') return 1;
    const started = held.cookedAt - GRILL_SECONDS;
    return Math.min(1, Math.max(0, (nowSeconds - started) / GRILL_SECONDS));
  }

  // Tap the plate: add the held item, or with empty hands lift the top one off.
  tapPlate() {
    if (this.hands && canPlate(this.hands)) {
      if (this.plate.length >= 4) return 'noop';
      this.plate.push(this.hands);
      this.hands = null;
      return 'plated';
    }
    if (!this.hands && this.plate.length > 0) {
      this.hands = this.plate.pop();
      return 'picked';
    }
    return 'noop';
  }

  plateKeys() {
    return this.plate.map((item) => plateKey(item.id, item.state));
  }

  clearPlate() {
    this.plate = [];
  }

  // Drop whatever is in hand into the bin.
  binHands() {
    if (!this.hands) return false;
    this.hands = null;
    return true;
  }

  // Drop the whole plate into the bin (a wrong build, start over).
  binPlate() {
    if (this.plate.length === 0) return false;
    this.plate = [];
    return true;
  }

  update(dt) {
    this.servedFlash = Math.max(0, this.servedFlash - dt);
    this.chopFlash = Math.max(0, this.chopFlash - dt);
  }
}
