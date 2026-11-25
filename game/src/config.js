// config.js — every tunable number, recipe and colour of Sizzle & Thyme lives here.
// Nothing in this file touches the DOM or the canvas; it is pure data.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

// A full shift lasts two and a half minutes of real play.
export const SHIFT_SECONDS = 150;
export const START_LIVES = 3;

// How fast new tickets arrive, and how long a ticket lives, as the shift wears on.
export const SPAWN_START_SECONDS = 14;
export const SPAWN_MIN_SECONDS = 7;
export const SPAWN_RAMP_PER_SECOND = 1 / 30;
export const ORDER_DEADLINE_START = 55;
export const ORDER_DEADLINE_MIN = 35;
export const ORDER_DEADLINE_RAMP_PER_SECOND = 1 / 20;
export const MAX_OPEN_ORDERS = 4;

// Station timings. Chopping takes three taps; a patty grills in six seconds
// and burns if it sits six seconds past done.
export const CHOP_TAPS = 3;
export const GRILL_SECONDS = 6;
export const BURN_AFTER_SECONDS = 6;

// Scoring: a served dish pays its base plus a tip for the time left on its
// ticket, plus a combo bonus that grows with every clean serve in a row.
export const SCORE_BASE = 100;
export const SCORE_TIP_MAX = 50;
export const SCORE_COMBO_STEP = 10;
export const SCORE_WRONG_PLATE = 0;

// Ingredient kinds. `prep` says what the ingredient needs before it can be
// plated: chop it on the board, grill it on the stove, or use it as it is.
export const INGREDIENTS = {
  tomato: { id: 'tomato', name: 'Tomato', prep: 'chop', colour: '#e2483d', light: '#ff7a6e' },
  lettuce: { id: 'lettuce', name: 'Lettuce', prep: 'chop', colour: '#58a83c', light: '#8ed06a' },
  onion: { id: 'onion', name: 'Onion', prep: 'chop', colour: '#efe6f2', light: '#ffffff' },
  patty: { id: 'patty', name: 'Beef Patty', prep: 'grill', colour: '#8a5a33', light: '#b07a4a' },
  bun: { id: 'bun', name: 'Brioche', prep: 'none', colour: '#e8a94f', light: '#f7cd8a' },
  cheese: { id: 'cheese', name: 'Cheddar', prep: 'none', colour: '#f5b81e', light: '#ffd95e' },
};

// The order in which crates sit on the counter, left to right.
export const CRATE_ORDER = ['tomato', 'lettuce', 'onion', 'patty', 'bun', 'cheese'];

// Every dish on the menu: the plated ingredients it needs, in stack order.
export const RECIPES = [
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    blurb: 'Crisp, bright, fast.',
    needs: ['tomato-chopped', 'lettuce-chopped'],
    base: 100,
  },
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    blurb: 'The house favourite.',
    needs: ['bun', 'patty-cooked', 'lettuce-chopped'],
    base: 120,
  },
  {
    id: 'cheesy-melt',
    name: 'Cheesy Melt',
    blurb: 'Golden and gooey.',
    needs: ['bun', 'patty-cooked', 'cheese'],
    base: 130,
  },
  {
    id: 'sunrise-stack',
    name: 'Sunrise Stack',
    blurb: 'Four layers, one bite.',
    needs: ['bun', 'patty-cooked', 'onion-chopped', 'cheese'],
    base: 160,
  },
];

// A plated item is named "<ingredient>-<state>" when it needed prep, or just
// "<ingredient>" when it plates as it is (bun, cheese) — matching the
// recipe lists, which write 'bun' and 'cheese' plain. Raw items never reach
// a plate, so 'bun-raw' can never appear here.
export function plateKey(ingredientId, state) {
  if (INGREDIENTS[ingredientId].prep === 'none') return ingredientId;
  return `${ingredientId}-${state}`;
}

// Warm kitchen palette: cream walls, terracotta tile, oak counters, teal trim.
export const PALETTE = {
  wallTop: '#f7ead2',
  wallBottom: '#f2d9b8',
  tile: '#e07856',
  tileDark: '#c95f43',
  floor: '#c98f5f',
  floorDark: '#b57a4c',
  counter: '#a9713f',
  counterTop: '#c08a52',
  counterEdge: '#8a5a2e',
  board: '#e8c890',
  boardEdge: '#b98d4f',
  grill: '#3d3d46',
  grillHot: '#e07840',
  plate: '#fdfbf6',
  plateEdge: '#d8cfc0',
  ink: '#3a2a1c',
  inkSoft: '#6b543d',
  teal: '#2e7f7a',
  tealDark: '#1f5f5b',
  gold: '#f5b81e',
  red: '#d64541',
  green: '#58a83c',
  cream: '#fff8ec',
};
