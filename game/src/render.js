// render.js — everything the player sees, drawn on one canvas with plain
// 2D shapes. No images, no fonts from the network: the food is drawn, so it
// is original art and it loads offline.

import { CANVAS_H, CANVAS_W, CRATE_ORDER, INGREDIENTS, PALETTE, RECIPES } from './config.js';

// Hit regions shared with input.js: every clickable station's rectangle.
export function layout() {
  return {
    tickets: { x: 24, y: 116, w: 292, h: 80, gap: 12 },
    crates: CRATE_ORDER.map((id, i) => ({
      id,
      x: 24 + i * (168 + 14),
      y: 218,
      w: 168,
      h: 96,
    })),
    trash: { x: 1130, y: 216, w: 126, h: 96 },
    board: { x: 24, y: 340, w: 380, h: 200 },
    grill: { x: 424, y: 340, w: 420, h: 200 },
    grillSlots: [
      { x: 452, y: 392, w: 168, h: 116 },
      { x: 648, y: 392, w: 168, h: 116 },
    ],
    plate: { x: 864, y: 340, w: 392, h: 200 },
    passPlate: { x: 300, y: 596, w: 300, h: 140 },
    hands: { x: 24, y: 596, w: 220, h: 140 },
    serve: { x: 1016, y: 596, w: 240, h: 140 },
    clearPlate: { x: 864, y: 500, w: 120, h: 32 },
  };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function text(ctx, s, x, y, font, colour, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function shadow(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(58,42,28,0.18)';
  ellipse(ctx, x + w / 2, y + h - 6, w / 2 - 6, 9);
  ctx.fill();
}

// ---------------------------------------------------------------- food art

// Draw one ingredient at (cx, cy), roughly `size` pixels across. `state`
// picks the look: raw, chopped, cooked or burnt. All food is drawn from
// circles, arcs and rounded shapes — original art, no images.
export function drawIngredient(ctx, id, state, cx, cy, size) {
  const s = size;
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'tomato') {
    if (state === 'chopped') {
      for (let i = -1; i <= 1; i += 1) {
        ctx.fillStyle = i === 0 ? '#e2483d' : '#d63a31';
        ctx.beginPath();
        ctx.arc(i * s * 0.26, (i % 2) * s * 0.08, s * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff8a7a';
        ctx.beginPath();
        ctx.arc(i * s * 0.26 - s * 0.06, (i % 2) * s * 0.08 - s * 0.07, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3f8f2f';
      ctx.fillRect(-s * 0.08, -s * 0.42, s * 0.16, s * 0.1);
    } else {
      ctx.fillStyle = '#e2483d';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8a7a';
      ctx.beginPath();
      ctx.arc(-s * 0.14, -s * 0.15, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f8f2f';
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * s * 0.32, -s * 0.3 + Math.sin(a) * s * 0.14, s * 0.14, s * 0.07, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id === 'lettuce') {
    if (state === 'chopped') {
      ctx.strokeStyle = '#58a83c';
      ctx.lineWidth = s * 0.09;
      ctx.lineCap = 'round';
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.4 + i * s * 0.2, s * 0.25);
        ctx.quadraticCurveTo(-s * 0.3 + i * s * 0.2, -s * 0.1, -s * 0.4 + i * s * 0.2 + s * 0.08, -s * 0.28);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#58a83c';
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * s * 0.22, Math.sin(a) * s * 0.22, s * 0.3, s * 0.2, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8ed06a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4c8f34';
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.26);
      ctx.lineTo(0, s * 0.26);
      ctx.stroke();
    }
  } else if (id === 'onion') {
    if (state === 'chopped') {
      ctx.strokeStyle = '#c9a8d6';
      ctx.lineWidth = s * 0.08;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(0, s * 0.05, s * (0.16 + i * 0.12), Math.PI, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#efe6f2';
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a8d6';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7fb069';
      ctx.beginPath();
      ctx.ellipse(s * 0.05, -s * 0.42, s * 0.06, s * 0.16, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    if (state === 'burnt') {
      ctx.fillStyle = '#221a14';
      rr(ctx, -s * 0.48, -s * 0.2, s * 0.96, s * 0.4, s * 0.16);
      ctx.fill();
      ctx.fillStyle = '#3a2c20';
      ctx.beginPath();
      ctx.arc(-s * 0.2, -s * 0.05, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.18, s * 0.06, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    } else if (state === 'cooked') {
      ctx.fillStyle = '#8a5a33';
      rr(ctx, -s * 0.48, -s * 0.22, s * 0.96, s * 0.44, s * 0.18);
      ctx.fill();
      ctx.fillStyle = '#b07a4a';
      rr(ctx, -s * 0.42, -s * 0.16, s * 0.84, s * 0.12, s * 0.06);
      ctx.fill();
      ctx.strokeStyle = '#5d3a1e';
      ctx.lineWidth = s * 0.05;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.26 - s * 0.06, -s * 0.18);
        ctx.lineTo(i * s * 0.26 + s * 0.06, s * 0.18);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#c98a7a';
      rr(ctx, -s * 0.48, -s * 0.22, s * 0.96, s * 0.44, s * 0.18);
      ctx.fill();
      ctx.fillStyle = '#e0a894';
      rr(ctx, -s * 0.42, -s * 0.16, s * 0.84, s * 0.12, s * 0.06);
      ctx.fill();
    }
  } else if (id === 'bun') {
    ctx.fillStyle = '#e8a94f';
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.46, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d18f33';
    ctx.fillRect(-s * 0.46, s * 0.06, s * 0.92, s * 0.1);
    ctx.fillStyle = '#fff3d0';
    for (const [dx, dy] of [[-0.2, -0.22], [0.05, -0.3], [0.26, -0.16], [-0.02, -0.1]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.05, s * 0.03, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f5b81e';
    ctx.beginPath();
    ctx.moveTo(-s * 0.46, s * 0.2);
    ctx.lineTo(s * 0.46, s * 0.2);
    ctx.lineTo(0, -s * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e09c08';
    ctx.beginPath();
    ctx.arc(-s * 0.14, s * 0.02, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.16, -s * 0.08, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd95e';
    ctx.beginPath();
    ctx.moveTo(-s * 0.46, s * 0.2);
    ctx.lineTo(-s * 0.2, s * 0.2);
    ctx.lineTo(0, -s * 0.34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawPlateDish(ctx, items, cx, cy, size) {
  // A white plate, then the dish stacked on it, bottom item first.
  ctx.fillStyle = PALETTE.plate;
  ellipse(ctx, cx, cy + size * 0.28, size * 0.62, size * 0.16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.plateEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8dfd0';
  ellipse(ctx, cx, cy + size * 0.24, size * 0.48, size * 0.1);
  ctx.fill();
  items.forEach((item, i) => {
    const y = cy + size * 0.18 - i * size * 0.16;
    drawIngredient(ctx, item.id, item.state, cx, y, size * 0.62);
  });
}

// ------------------------------------------------------------------ scenes

function drawBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0, PALETTE.wallTop);
  g.addColorStop(0.55, PALETTE.wallBottom);
  g.addColorStop(0.55, PALETTE.floor);
  g.addColorStop(1, PALETTE.floorDark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Terracotta tile band.
  ctx.fillStyle = PALETTE.tile;
  ctx.fillRect(0, 400, CANVAS_W, 34);
  ctx.fillStyle = PALETTE.tileDark;
  for (let x = 0; x < CANVAS_W; x += 64) ctx.fillRect(x, 400, 2, 34);
  ctx.fillRect(0, 416, CANVAS_W, 2);
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(58,42,28,0.92)';
  ctx.fillRect(0, 0, CANVAS_W, 92);
  text(ctx, 'Sizzle & Thyme', 24, 40, 'bold 30px Georgia, serif', '#ffd95e');
  text(ctx, 'a cozy kitchen rush', 24, 66, 'italic 14px Georgia, serif', '#f2d9b8');
  text(ctx, `SCORE  ${state.score}`, 330, 42, 'bold 26px Trebuchet MS, sans-serif', '#fff8ec');
  if (state.combo > 1) {
    text(ctx, `COMBO x${state.combo}`, 330, 70, 'bold 16px Trebuchet MS, sans-serif', PALETTE.gold);
  }
  // Shift timer: big, and it turns red in the last thirty seconds.
  const left = Math.max(0, state.shiftLeft);
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60).toString().padStart(2, '0');
  const urgent = left <= 30;
  text(ctx, `${mm}:${ss}`, 1150, 48, 'bold 34px Trebuchet MS, sans-serif', urgent ? '#ff6b5e' : '#fff8ec', 'right');
  text(ctx, 'SHIFT', 1150, 70, 'bold 12px Trebuchet MS, sans-serif', '#f2d9b8', 'right');
  // Lives as little hearts.
  for (let i = 0; i < 3; i += 1) {
    const x = 980 + i * 34;
    ctx.fillStyle = i < state.lives ? '#ff6b5e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x, 34, 10, 0, Math.PI * 2);
    ctx.arc(x + 14, 34, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 7, 38);
    ctx.lineTo(x + 21, 38);
    ctx.lineTo(x + 7, 54);
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, 'LIVES', 980, 70, 'bold 12px Trebuchet MS, sans-serif', '#f2d9b8');
}

function drawOrderBoard(ctx, rail, elapsed) {
  const T = layout().tickets;
  text(ctx, 'ORDER BOARD', 24, 110, 'bold 13px Trebuchet MS, sans-serif', PALETTE.inkSoft);
  if (rail.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,248,236,0.75)';
    rr(ctx, T.x, T.y, 400, T.h, 10);
    ctx.fill();
    text(ctx, 'No tickets yet — the lunch rush is coming…', T.x + 16, T.y + 50, 'italic 16px Georgia, serif', PALETTE.inkSoft);
    return;
  }
  rail.orders.forEach((order, i) => {
    const x = T.x + i * (T.w + T.gap);
    const left = rail.timeLeft(order, elapsed);
    const frac = left / order.deadline;
    const hot = left <= 10;
    ctx.fillStyle = hot ? '#ffe3de' : '#fff8ec';
    rr(ctx, x, T.y, T.w, T.h, 10);
    ctx.fill();
    ctx.strokeStyle = hot ? '#d64541' : '#d8cfc0';
    ctx.lineWidth = hot ? 3 : 2;
    ctx.stroke();
    text(ctx, `#${order.id}  ${order.recipe.name}`, x + 12, T.y + 26, 'bold 17px Trebuchet MS, sans-serif', PALETTE.ink);
    text(ctx, order.recipe.needs.map((n) => n.replace('-chopped', ' ✂').replace('-cooked', ' ♨')).join('  +  '), x + 12, T.y + 48, '13px Trebuchet MS, sans-serif', PALETTE.inkSoft);
    // Countdown bar.
    ctx.fillStyle = '#e8dfd0';
    rr(ctx, x + 12, T.y + 58, T.w - 24, 10, 5);
    ctx.fill();
    ctx.fillStyle = hot ? '#d64541' : frac > 0.5 ? PALETTE.green : PALETTE.gold;
    if (frac > 0) {
      rr(ctx, x + 12, T.y + 58, (T.w - 24) * frac, 10, 5);
      ctx.fill();
    }
    text(ctx, `${Math.ceil(left)}s`, x + T.w - 12, T.y + 26, 'bold 16px Trebuchet MS, sans-serif', hot ? '#d64541' : PALETTE.ink, 'right');
  });
}

function drawCrates(ctx, kitchen) {
  const L = layout();
  text(ctx, 'PANTRY — click an ingredient to pick it up', 24, 212, 'bold 13px Trebuchet MS, sans-serif', PALETTE.inkSoft);
  for (const crate of L.crates) {
    const ing = INGREDIENTS[crate.id];
    const held = kitchen.hands && kitchen.hands.id === crate.id;
    ctx.fillStyle = held ? '#f7e3b8' : '#f3e2c2';
    rr(ctx, crate.x, crate.y, crate.w, crate.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#b98d4f';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, crate.id, 'raw', crate.x + 44, crate.y + 48, 64);
    text(ctx, ing.name, crate.x + 84, crate.y + 40, 'bold 14px Trebuchet MS, sans-serif', PALETTE.ink);
    text(ctx, ing.prep === 'chop' ? 'chop it' : ing.prep === 'grill' ? 'grill it' : 'ready', crate.x + 84, crate.y + 62, '12px Trebuchet MS, sans-serif', PALETTE.inkSoft);
    if (held) {
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 3;
      rr(ctx, crate.x, crate.y, crate.w, crate.h, 10);
      ctx.stroke();
    }
  }
  // Trash bin.
  const t = L.trash;
  ctx.fillStyle = '#6b6b74';
  rr(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fill();
  ctx.fillStyle = '#4a4a52';
  rr(ctx, t.x + 10, t.y + 8, t.w - 20, 14, 6);
  ctx.fill();
  text(ctx, '🗑 BIN', t.x + t.w / 2, t.y + 62, 'bold 16px Trebuchet MS, sans-serif', '#fff8ec', 'center');
  text(ctx, 'drop to discard', t.x + t.w / 2, t.y + 82, '11px Trebuchet MS, sans-serif', '#d8d8de', 'center');
}

function drawBoard(ctx, kitchen) {
  const B = layout().board;
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, B.x, B.y, B.w, B.h, 12);
  ctx.fill();
  text(ctx, 'CHOPPING BOARD — click to chop (3 taps)', B.x + 16, B.y + 26, 'bold 13px Trebuchet MS, sans-serif', '#f7ead2');
  ctx.fillStyle = PALETTE.board;
  rr(ctx, B.x + 24, B.y + 40, B.w - 48, B.h - 64, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  const cx = B.x + B.w / 2;
  const cy = B.y + 118;
  if (kitchen.board) {
    drawIngredient(ctx, kitchen.board.item.id, kitchen.board.item.state, cx, cy, 110);
    if (kitchen.board.item.state === 'raw') {
      // Chop progress pips.
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = i < kitchen.board.taps ? PALETTE.teal : '#d8cfc0';
        ctx.beginPath();
        ctx.arc(cx - 30 + i * 30, B.y + B.h - 18, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      text(ctx, 'chopped — click to pick up', cx, B.y + B.h - 12, 'bold 13px Trebuchet MS, sans-serif', '#ffd95e', 'center');
    }
  } else {
    ctx.fillStyle = '#b98d4f';
    text(ctx, 'bring something to chop', cx, cy + 6, 'italic 16px Georgia, serif', '#8a6a42', 'center');
  }
  if (kitchen.chopFlash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    rr(ctx, B.x + 24, B.y + 40, B.w - 48, B.h - 64, 10);
    ctx.fill();
  }
}

function drawGrill(ctx, kitchen, nowSeconds) {
  const G = layout().grill;
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, G.x, G.y, G.w, G.h, 12);
  ctx.fill();
  text(ctx, 'STOVE — click a patty on, click to lift it off', G.x + 16, G.y + 26, 'bold 13px Trebuchet MS, sans-serif', '#f7ead2');
  layout().grillSlots.forEach((slot, i) => {
    const held = kitchen.grill[i];
    ctx.fillStyle = PALETTE.grill;
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#22222a';
    ctx.lineWidth = 3;
    for (let gx = slot.x + 18; gx < slot.x + slot.w - 8; gx += 22) {
      ctx.beginPath();
      ctx.moveTo(gx, slot.y + 10);
      ctx.lineTo(gx, slot.y + slot.h - 10);
      ctx.stroke();
    }
    if (held) {
      const prog = kitchen.grillProgress(i, nowSeconds);
      const cx = slot.x + slot.w / 2;
      const cy = slot.y + slot.h / 2 - 6;
      drawIngredient(ctx, held.item.id, held.item.state, cx, cy, 96);
      if (held.item.state === 'raw') {
        ctx.fillStyle = '#e8dfd0';
        rr(ctx, slot.x + 12, slot.y + slot.h - 18, slot.w - 24, 8, 4);
        ctx.fill();
        ctx.fillStyle = PALETTE.grillHot;
        rr(ctx, slot.x + 12, slot.y + slot.h - 18, (slot.w - 24) * prog, 8, 4);
        ctx.fill();
      } else if (held.item.state === 'cooked') {
        text(ctx, 'READY!', slot.x + slot.w / 2, slot.y + slot.h - 8, 'bold 13px Trebuchet MS, sans-serif', '#ffd95e', 'center');
      } else {
        text(ctx, 'BURNT — bin it!', slot.x + slot.w / 2, slot.y + slot.h - 8, 'bold 13px Trebuchet MS, sans-serif', '#ff8a7a', 'center');
      }
    } else {
      text(ctx, 'empty burner', slot.x + slot.w / 2, slot.y + slot.h / 2 + 6, 'italic 14px Georgia, serif', '#8a8a94', 'center');
    }
  });
}

function drawPlateStation(ctx, kitchen, rail, elapsed) {
  const P = layout().plate;
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, P.x, P.y, P.w, P.h, 12);
  ctx.fill();
  text(ctx, 'PLATING — click with an item to stack it', P.x + 16, P.y + 26, 'bold 13px Trebuchet MS, sans-serif', '#f7ead2');
  const cx = P.x + P.w / 2;
  const cy = P.y + 108;
  if (kitchen.plate.length === 0) {
    ctx.fillStyle = PALETTE.plate;
    ellipse(ctx, cx, cy + 26, 110, 22);
    ctx.fill();
    ctx.strokeStyle = PALETTE.plateEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'an empty plate', cx, cy + 60, 'italic 15px Georgia, serif', '#8a6a42', 'center');
  } else {
    drawPlateDish(ctx, kitchen.plate, cx, cy, 150);
    const match = rail.matchPlate(kitchen.plateKeys());
    if (match) {
      text(ctx, `matches #${match.id} ${match.recipe.name}!`, cx, P.y + P.h - 12, 'bold 14px Trebuchet MS, sans-serif', '#ffd95e', 'center');
    } else {
      text(ctx, 'not a recipe yet — keep stacking', cx, P.y + P.h - 12, '13px Trebuchet MS, sans-serif', '#f7ead2', 'center');
    }
  }
}

function drawPass(ctx, kitchen, rail, elapsed) {
  const L = layout();
  // The pass: a long steel counter along the bottom.
  ctx.fillStyle = '#8f979e';
  rr(ctx, 0, 576, CANVAS_W, 224, 0);
  ctx.fill();
  ctx.fillStyle = '#aab2b8';
  ctx.fillRect(0, 576, CANVAS_W, 8);
  // Hands slot.
  const H = L.hands;
  ctx.fillStyle = '#7d838a';
  rr(ctx, H.x, H.y, H.w, H.h, 10);
  ctx.fill();
  text(ctx, 'IN HAND', H.x + 14, H.y + 24, 'bold 12px Trebuchet MS, sans-serif', '#e8ecee');
  if (kitchen.hands) {
    drawIngredient(ctx, kitchen.hands.id, kitchen.hands.state, H.x + H.w / 2, H.y + 82, 76);
    const label = `${INGREDIENTS[kitchen.hands.id].name} · ${kitchen.hands.state}`;
    text(ctx, label, H.x + H.w / 2, H.y + H.h - 10, 'bold 13px Trebuchet MS, sans-serif', '#fff8ec', 'center');
  } else {
    text(ctx, 'empty hands', H.x + H.w / 2, H.y + 82, 'italic 15px Georgia, serif', '#d8dde0', 'center');
  }
  // The plate waiting on the pass.
  const PP = L.passPlate;
  ctx.fillStyle = '#7d838a';
  rr(ctx, PP.x, PP.y, PP.w, PP.h, 10);
  ctx.fill();
  text(ctx, 'ON THE PASS', PP.x + 14, PP.y + 24, 'bold 12px Trebuchet MS, sans-serif', '#e8ecee');
  if (kitchen.passPlate) {
    drawPlateDish(ctx, kitchen.passPlate, PP.x + PP.w / 2, PP.y + 74, 120);
  } else {
    text(ctx, 'nothing served yet', PP.x + PP.w / 2, PP.y + 82, 'italic 15px Georgia, serif', '#d8dde0', 'center');
  }
  // Big SERVE button.
  const S = L.serve;
  const match = kitchen.plate.length > 0 ? rail.matchPlate(kitchen.plateKeys()) : null;
  const ready = !!match;
  ctx.fillStyle = ready ? PALETTE.gold : '#5d636a';
  rr(ctx, S.x, S.y, S.w, S.h, 14);
  ctx.fill();
  if (ready) {
    ctx.strokeStyle = '#fff3d0';
    ctx.lineWidth = 3;
    rr(ctx, S.x + 4, S.y + 4, S.w - 8, S.h - 8, 11);
    ctx.stroke();
  }
  text(ctx, 'SERVE', S.x + S.w / 2, S.y + 62, 'bold 34px Trebuchet MS, sans-serif', ready ? '#3a2a1c' : '#c8ccd0', 'center');
  text(ctx, ready ? `ticket #${match.id} · +${match.recipe.base}` : 'finish a recipe first', S.x + S.w / 2, S.y + 92, 'bold 14px Trebuchet MS, sans-serif', ready ? '#3a2a1c' : '#c8ccd0', 'center');
  text(ctx, 'or press SPACE', S.x + S.w / 2, S.y + 116, '12px Trebuchet MS, sans-serif', ready ? '#5d4a22' : '#aab0b6', 'center');
  // Controls hint, bottom right of the pass.
  text(ctx, 'Keys: 1–6 pantry · C chop · G grill · SPACE serve · B bin · P pause · R restart', 640, 782, '12px Trebuchet MS, sans-serif', '#5d636a', 'center');
}

// A floating score popup, drawn over the scene for a second after a serve.
function drawPopups(ctx, popups) {
  for (const p of popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    text(ctx, p.label, p.x, p.y, 'bold 26px Trebuchet MS, sans-serif', '#2e7f7a', 'center');
    ctx.globalAlpha = 1;
  }
}

function drawToast(ctx, message) {
  if (!message) return;
  ctx.fillStyle = 'rgba(58,42,28,0.9)';
  const w = ctx.measureText(message).width + 36;
  rr(ctx, (CANVAS_W - w) / 2, 544, w, 30, 15);
  ctx.fill();
  text(ctx, message, CANVAS_W / 2, 565, 'bold 15px Trebuchet MS, sans-serif', '#fff8ec', 'center');
}

// ------------------------------------------------------------------ frames

export function drawGame(ctx, state) {
  drawBackground(ctx);
  drawHud(ctx, state);
  drawOrderBoard(ctx, state.rail, state.elapsed);
  drawCrates(ctx, state.kitchen);
  drawBoard(ctx, state.kitchen);
  drawGrill(ctx, state.kitchen, state.elapsed);
  drawPlateStation(ctx, state.kitchen, state.rail, state.elapsed);
  drawPass(ctx, state.kitchen, state.rail, state.elapsed);
  drawPopups(ctx, state.popups);
  drawToast(ctx, state.toast);
  if (state.paused) {
    ctx.fillStyle = 'rgba(58,42,28,0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    text(ctx, 'PAUSED', CANVAS_W / 2, 380, 'bold 64px Georgia, serif', '#fff8ec', 'center');
    text(ctx, 'press P to keep cooking', CANVAS_W / 2, 430, '20px Georgia, serif', '#f2d9b8', 'center');
  }
}

export function drawTitle(ctx, best) {
  drawBackground(ctx);
  ctx.fillStyle = 'rgba(58,42,28,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'Sizzle & Thyme', CANVAS_W / 2, 220, 'bold 84px Georgia, serif', '#ffd95e', 'center');
  text(ctx, 'a cozy kitchen rush', CANVAS_W / 2, 268, 'italic 28px Georgia, serif', '#f2d9b8', 'center');
  text(ctx, 'Tickets land on the board. Chop, grill, stack, serve —', CANVAS_W / 2, 340, '22px Trebuchet MS, sans-serif', '#fff8ec', 'center');
  text(ctx, 'before the clock runs out and the lunch rush eats you alive.', CANVAS_W / 2, 372, '22px Trebuchet MS, sans-serif', '#fff8ec', 'center');
  // A little menu card.
  ctx.fillStyle = '#fff8ec';
  rr(ctx, 390, 410, 500, 150, 14);
  ctx.fill();
  text(ctx, "TODAY'S MENU", 640, 444, 'bold 16px Trebuchet MS, sans-serif', PALETTE.teal, 'center');
  RECIPES.forEach((r, i) => {
    text(ctx, `${r.name} — ${r.needs.map((n) => n.split('-')[0]).join(' + ')}`, 640, 474 + i * 22, '16px Trebuchet MS, sans-serif', PALETTE.ink, 'center');
  });
  text(ctx, 'CLICK or press ENTER to start the shift', CANVAS_W / 2, 620, 'bold 24px Trebuchet MS, sans-serif', '#ffd95e', 'center');
  text(ctx, 'Mouse + keys 1–6 · C chop · G grill · SPACE serve · B bin', CANVAS_W / 2, 656, '16px Trebuchet MS, sans-serif', '#f2d9b8', 'center');
  if (best > 0) text(ctx, `Best shift so far: ${best}`, CANVAS_W / 2, 700, 'bold 18px Trebuchet MS, sans-serif', '#fff8ec', 'center');
}

export function drawGameOver(ctx, state) {
  drawBackground(ctx);
  ctx.fillStyle = 'rgba(58,42,28,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const title = state.lives <= 0 ? 'The rush got you!' : 'Shift complete!';
  text(ctx, title, CANVAS_W / 2, 240, 'bold 64px Georgia, serif', '#ffd95e', 'center');
  text(ctx, `Final score: ${state.score}`, CANVAS_W / 2, 320, 'bold 34px Trebuchet MS, sans-serif', '#fff8ec', 'center');
  text(ctx, `Dishes served: ${state.served}   Best combo: x${state.bestCombo}   Tickets lost: ${state.lost}`, CANVAS_W / 2, 368, '20px Trebuchet MS, sans-serif', '#f2d9b8', 'center');
  if (state.score >= state.best && state.score > 0) {
    text(ctx, '★ A new best shift! ★', CANVAS_W / 2, 420, 'bold 24px Trebuchet MS, sans-serif', '#ffd95e', 'center');
  }
  text(ctx, 'CLICK or press R to cook again', CANVAS_W / 2, 500, 'bold 24px Trebuchet MS, sans-serif', '#fff8ec', 'center');
}

export { RECIPES };
