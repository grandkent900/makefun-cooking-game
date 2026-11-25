// audio.js — every sound is synthesised with WebAudio; no audio files ship
// with the game, so it stays silent until the player first clicks or taps.

let audioCtx = null;
let sizzleNodes = null;

export function ensureAudio() {
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, gain, filterFreq) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const amp = ctx.createGain();
  amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(ctx.destination);
  src.start();
}

export const sfx = {
  // A knife thock: short filtered noise, higher each tap.
  chop(step) {
    noiseBurst(0.07, 0.5, 900 + step * 350);
    tone(180 + step * 40, 0.06, 'triangle', 0.18);
  },
  // Picking something up: a soft pop.
  pickup() {
    tone(520, 0.08, 'sine', 0.22, 0, 760);
  },
  // Placing an item down: a low wooden tap.
  place() {
    tone(240, 0.09, 'triangle', 0.25, 0, 170);
  },
  // A patty hits the grill: a sizzle burst.
  grillStart() {
    noiseBurst(0.35, 0.35, 3200);
  },
  // A ticket lands on the board: two-note chime.
  newOrder() {
    tone(660, 0.1, 'sine', 0.2);
    tone(880, 0.14, 'sine', 0.2, 0.09);
  },
  // Serving a dish: a bright three-note ding.
  serve() {
    tone(523, 0.12, 'sine', 0.25);
    tone(659, 0.12, 'sine', 0.25, 0.09);
    tone(784, 0.22, 'sine', 0.28, 0.18);
  },
  // A ticket expired: a low buzz.
  expire() {
    tone(160, 0.35, 'sawtooth', 0.16, 0, 90);
  },
  // A burnt patty: a sad descending blip.
  burnt() {
    tone(320, 0.2, 'square', 0.1, 0, 140);
  },
  // Last ten seconds on a ticket: a tick.
  tick() {
    tone(1100, 0.05, 'square', 0.08);
  },
  // Game over: a short closing phrase.
  gameOver() {
    tone(392, 0.2, 'triangle', 0.22);
    tone(330, 0.2, 'triangle', 0.22, 0.18);
    tone(262, 0.4, 'triangle', 0.22, 0.36);
  },
};

// A looping grill hiss while at least one patty cooks; call with true/false.
export function setSizzle(on) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (on && !sizzleNodes) {
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4200;
    const amp = ctx.createGain();
    amp.gain.value = 0.05;
    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start();
    sizzleNodes = { src, amp };
  } else if (!on && sizzleNodes) {
    sizzleNodes.src.stop();
    sizzleNodes = null;
  }
}
