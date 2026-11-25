// orders.js — the ticket rail: spawning, deadlines, scoring and expiry.
// An order is a recipe plus a countdown. The rail owns the spawn clock and
// decides what a served plate is worth.

import {
  MAX_OPEN_ORDERS,
  ORDER_DEADLINE_MIN,
  ORDER_DEADLINE_RAMP_PER_SECOND,
  ORDER_DEADLINE_START,
  RECIPES,
  SCORE_BASE,
  SCORE_COMBO_STEP,
  SCORE_TIP_MAX,
  SPAWN_MIN_SECONDS,
  SPAWN_RAMP_PER_SECOND,
  SPAWN_START_SECONDS,
} from './config.js';
import { pickFrom } from './rng.js';

let nextOrderId = 1;

export function makeOrder(recipe, deadlineSeconds, nowSeconds) {
  const order = {
    id: nextOrderId,
    recipe,
    bornAt: nowSeconds,
    deadline: deadlineSeconds,
    expiresAt: nowSeconds + deadlineSeconds,
  };
  nextOrderId += 1;
  return order;
}

export function resetOrderIds() {
  nextOrderId = 1;
}

export function spawnIntervalAt(elapsedSeconds) {
  return Math.max(
    SPAWN_MIN_SECONDS,
    SPAWN_START_SECONDS - elapsedSeconds * SPAWN_RAMP_PER_SECOND,
  );
}

export function deadlineAt(elapsedSeconds) {
  return Math.max(
    ORDER_DEADLINE_MIN,
    ORDER_DEADLINE_START - elapsedSeconds * ORDER_DEADLINE_RAMP_PER_SECOND,
  );
}

// Pick the next recipe: never repeat the ticket that just spawned, so the
// board always shows a spread of dishes.
export function chooseRecipe(rng, lastRecipeId) {
  const pool = RECIPES.filter((r) => r.id !== lastRecipeId);
  return pickFrom(rng, pool.length ? pool : RECIPES);
}

export class OrderRail {
  constructor(rng) {
    this.rng = rng;
    this.orders = [];
    this.timeSinceSpawn = 0;
    this.lastRecipeId = null;
    this.spawnedCount = 0;
  }

  // Advance the clock by dt seconds of play. Returns the orders that just
  // expired (the caller docks a life for each) and the orders just spawned.
  update(dt, elapsedSeconds) {
    const spawned = [];
    const expired = [];
    this.timeSinceSpawn += dt;
    if (
      this.orders.length < MAX_OPEN_ORDERS &&
      this.timeSinceSpawn >= spawnIntervalAt(elapsedSeconds)
    ) {
      this.timeSinceSpawn = 0;
      const recipe = chooseRecipe(this.rng, this.lastRecipeId);
      this.lastRecipeId = recipe.id;
      const order = makeOrder(recipe, deadlineAt(elapsedSeconds), elapsedSeconds);
      this.orders.push(order);
      this.spawnedCount += 1;
      spawned.push(order);
    }
    const stillOpen = [];
    for (const order of this.orders) {
      if (elapsedSeconds >= order.expiresAt) expired.push(order);
      else stillOpen.push(order);
    }
    this.orders = stillOpen;
    return { spawned, expired };
  }

  // How many seconds a ticket has left, never below zero.
  timeLeft(order, elapsedSeconds) {
    return Math.max(0, order.expiresAt - elapsedSeconds);
  }

  // Find the open ticket a finished plate satisfies. The plate's stacked
  // keys must match a recipe's needs exactly, order aside.
  matchPlate(plateKeys) {
    const sorted = plateKeys.slice().sort().join('|');
    return this.orders.find(
      (o) => o.recipe.needs.slice().sort().join('|') === sorted,
    ) || null;
  }

  // Score a served dish: recipe base, a tip for time left, and a combo bonus.
  scoreServe(order, elapsedSeconds, combo) {
    const left = this.timeLeft(order, elapsedSeconds);
    const tip = Math.round((left / order.deadline) * SCORE_TIP_MAX);
    const comboBonus = combo * SCORE_COMBO_STEP;
    return order.recipe.base + tip + comboBonus;
  }

  remove(order) {
    this.orders = this.orders.filter((o) => o.id !== order.id);
  }

  // The ticket in the most danger, for the urgency glow.
  mostUrgent(elapsedSeconds) {
    let worst = null;
    let worstLeft = Infinity;
    for (const order of this.orders) {
      const left = this.timeLeft(order, elapsedSeconds);
      if (left < worstLeft) {
        worstLeft = left;
        worst = order;
      }
    }
    return worst;
  }
}

export { SCORE_BASE };
