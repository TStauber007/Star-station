// Gentle sound effects, made with Web Audio. Nothing loud, nothing sharp.
import { audio } from './engine.ts';

const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function tone(freq: number, opts: { type?: OscillatorType; t?: number; peak?: number; attack?: number; decay?: number; glide?: number; vibrato?: number } = {}) {
  const ctx = audio.ctx, bus = audio.bus('sfx');
  if (!ctx || !bus) return;
  const t = ctx.currentTime + (opts.t ?? 0);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (opts.glide) o.frequency.exponentialRampToValueAtTime(opts.glide, t + (opts.attack ?? 0.01) + (opts.decay ?? 0.3));
  if (opts.vibrato) {
    const l = ctx.createOscillator(), lg = ctx.createGain();
    l.frequency.value = opts.vibrato; lg.gain.value = freq * 0.03;
    l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + 2);
  }
  o.connect(g); g.connect(bus);
  env(g, t, opts.peak ?? 0.12, opts.attack ?? 0.01, opts.decay ?? 0.4);
  o.start(t); o.stop(t + (opts.attack ?? 0.01) + (opts.decay ?? 0.4) + 0.05);
}

let noiseBuf: AudioBuffer | null = null;
function noise(opts: { t?: number; dur?: number; peak?: number; type?: BiquadFilterType; f0?: number; f1?: number; q?: number; attack?: number }) {
  const ctx = audio.ctx, bus = audio.bus('sfx');
  if (!ctx || !bus) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + (opts.t ?? 0);
  const dur = opts.dur ?? 0.3;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = opts.type ?? 'bandpass'; f.Q.value = opts.q ?? 1.2;
  f.frequency.setValueAtTime(opts.f0 ?? 1200, t);
  if (opts.f1) f.frequency.exponentialRampToValueAtTime(opts.f1, t + dur);
  const g = ctx.createGain();
  src.connect(f); f.connect(g); g.connect(bus);
  env(g, t, opts.peak ?? 0.08, opts.attack ?? 0.02, dur);
  src.start(t, Math.random()); src.stop(t + dur + 0.1);
}

const bell = (freq: number, t = 0, peak = 0.1, decay = 1.2) => {
  tone(freq, { t, peak, decay, attack: 0.005 });
  tone(freq * 2.01, { t, peak: peak * 0.25, decay: decay * 0.5, attack: 0.005 });
};

let lastTap = 0;

export const sfx: Record<string, (arg?: number) => void> = {
  tap(i = -1) {
    const now = performance.now();
    if (now - lastTap < 60) return;
    lastTap = now;
    const f = i >= 0 ? PENTA[i % PENTA.length] : PENTA[Math.floor(Math.random() * PENTA.length)];
    bell(f * 2, 0, 0.07, 0.6);
  },
  target(i = 0) { bell(PENTA[(i + 2) % PENTA.length], 0, 0.1, 0.9); },
  done() { [0, 2, 4].forEach((k, n) => bell(PENTA[k] * 2, n * 0.12, 0.08, 1.1)); },
  select() { bell(659.25, 0, 0.1, 0.8); bell(987.77, 0.12, 0.09, 1.1); },
  page() { noise({ dur: 0.35, f0: 600, f1: 2400, peak: 0.035, q: 0.7 }); },
  sticker() { [0, 2, 4, 5, 7].forEach((k, n) => bell(PENTA[k % PENTA.length] * (k > 4 ? 2 : 1), n * 0.14, 0.07, 1.6)); },
  chime() { bell(1318.5, 0, 0.08, 1.4); bell(1975.5, 0.15, 0.06, 1.6); },
  velcro() { for (let i = 0; i < 6; i++) noise({ t: i * 0.035, dur: 0.05, f0: 2500, peak: 0.05, q: 3 }); },
  dingdong() { bell(783.99, 0, 0.1, 1.2); bell(659.25, 0.45, 0.1, 1.6); },
  hatch() { tone(110, { peak: 0.12, decay: 0.5, glide: 70 }); noise({ t: 0.05, dur: 0.6, f0: 300, f1: 1200, peak: 0.03 }); },
  whirl() { noise({ dur: 0.9, f0: 500, f1: 1500, peak: 0.04, q: 4 }); },
  song() { [523.25, 659.25, 783.99, 659.25, 880].forEach((f, i) => tone(f, { t: i * 0.28, peak: 0.07, decay: 0.5, type: 'triangle' })); },
  boop() { tone(520, { peak: 0.1, decay: 0.18, glide: 780 }); },
  whoosh() { noise({ dur: 0.55, f0: 300, f1: 2200, peak: 0.05, q: 0.8 }); },
  blup() { tone(900, { peak: 0.09, decay: 0.16, glide: 300 }); },
  crunch() { for (let i = 0; i < 3; i++) noise({ t: i * 0.09, dur: 0.07, f0: 1800, peak: 0.07, type: 'lowpass', q: 0.5 }); },
  radio() { noise({ dur: 0.4, f0: 1500, peak: 0.025, q: 6 }); tone(1046.5, { t: 0.42, peak: 0.05, decay: 0.15 }); },
  bump() { tone(95, { peak: 0.16, decay: 0.25, glide: 60 }); },
  wobble() { tone(330, { peak: 0.07, decay: 0.7, vibrato: 7 }); },
  swish() { noise({ dur: 0.35, f0: 1200, f1: 4000, peak: 0.04, type: 'highpass', q: 0.5 }); },
  powerdown() { tone(620, { peak: 0.07, decay: 0.9, glide: 150 }); },
  click() { noise({ dur: 0.02, f0: 3000, peak: 0.06, q: 2 }); tone(1800, { peak: 0.04, decay: 0.05 }); },
  hum() { tone(110, { peak: 0.06, attack: 0.3, decay: 1.4 }); tone(220, { peak: 0.025, attack: 0.3, decay: 1.4 }); },
  clink() { bell(2093, 0, 0.05, 0.3); bell(3136, 0.06, 0.035, 0.25); },
  gurgle() { for (let i = 0; i < 6; i++) tone(260 + Math.random() * 300, { t: i * 0.12 + Math.random() * 0.04, peak: 0.07, decay: 0.12, glide: 160 }); },
  zip() { noise({ dur: 0.3, f0: 800, f1: 3000, peak: 0.04, q: 2 }); },
  giggle() { [900, 1050, 950, 1150, 1050].forEach((f, i) => tone(f, { t: i * 0.08, peak: 0.07, decay: 0.08, glide: f * 1.2 })); },
  beep(i = 0) { tone(600 + i * 120, { peak: 0.07, decay: 0.12, type: 'triangle' }); },
  boing() { tone(220, { peak: 0.09, decay: 0.35, glide: 520, vibrato: 12 }); },
  twinkle() { bell(PENTA[Math.floor(Math.random() * 5) + 3] * 2, 0, 0.05, 1.2); },
  breeze() { noise({ dur: 0.8, f0: 400, f1: 900, peak: 0.035, q: 0.6, attack: 0.2 }); },
};

export function playSfx(name: string, arg?: number) {
  try { sfx[name]?.(arg); } catch { /* never let a sound break the story */ }
}
