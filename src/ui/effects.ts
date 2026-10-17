// What happens when Tommy taps (tap-anything moments) and when a hands-on
// target is tapped. Gentle: soft sounds, small sparkles, nothing flashing.
import type { StateValues } from '../story/types.ts';
import type { Stage, TargetSpec } from './stage.ts';
import { playSfx } from '../audio/sfx.ts';
import { C } from '../art/palette.ts';

export interface TapCtx { stage: Stage; i: number; count: number; px: number; py: number; state: StateValues }

const MOONS = ['crescent', 'half', 'gibbous', 'full'];

export const TAP_FX: Record<string, (c: TapCtx) => void> = {
  wake: ({ stage, i, count }) => { stage.patch({ lights: `wake:${Math.ceil((i / count) * 8)}` }); playSfx('tap', i + 2); },
  boop: ({ stage, i, count }) => { stage.bump('robot', 'boop-once', 600); playSfx('boop'); if (i === count) setTimeout(() => playSfx('giggle'), 250); },
  hello: ({ stage, px, py, i }) => { stage.floatUp(px, py, 'heart'); playSfx('tap', i); },
  partylights: ({ stage, i, count, state }) => { stage.patch({ lights: `party:${state.shipColor || 'yellow'}:${Math.ceil((i / count) * 5)}` }); playSfx('tap', i + 1); },
  growlights: ({ stage, i, count }) => { stage.patch({ lights: i >= count ? 'on' : `grow:${i}` }); playSfx('tap', i + 3); },
  sparkle: ({ i }) => playSfx('tap', i),
  bubbles: ({ stage, px, py }) => { stage.floatUp(px, py, 'bubble'); setTimeout(() => stage.floatUp(px + 30, py + 10, 'bubble'), 160); playSfx('blup'); },
  grow: ({ stage, i, count }) => {
    stage.overlay('#1a1f4a', 0.28, 'night');
    setTimeout(() => stage.overlay('#1a1f4a', 0, 'night'), 700);
    const moons = Array.from({ length: count }, (_, k) => `<span class="sleep-moon ${k < i ? 'on' : ''}"></span>`).join('');
    const [x, y] = stage.px(0, 120);
    stage.badge('sleeps', x, y, `<div class="sleep-row">${moons}</div>`);
    playSfx('twinkle');
  },
  sunbeams: ({ stage, px, py, i }) => { stage.bump('station', 'glint-once', 900); stage.sparkle(px, py, { color: C.sunGlow, count: 6 }); playSfx('tap', i + 3); },
  spin: ({ stage }) => { stage.bump('A', 'spin-once', 1300); stage.bump('T', 'spin-once', 1300); playSfx('whoosh'); },
  bounce: ({ stage, px, py }) => {
    const el = stage.actor('prop:ball');
    if (el) {
      const r = el.getBoundingClientRect(), sr = stage.el.getBoundingClientRect();
      el.style.transform = `translate(${px - r.width / 2 - 0}px, ${py - r.height / 2 - 0}px)`;
      void sr;
    }
    playSfx('boing');
  },
  charge: ({ stage, i, count }) => {
    const a = stage.actorSpec('robot');
    if (a) {
      const [x, y] = stage.px(a.x + a.w * 0.55, a.y - a.h * 0.35);
      const cells = Array.from({ length: count }, (_, k) => `<span class="cell ${k < i ? 'on' : ''}"></span>`).join('');
      stage.badge('battery', x, y, `<div class="battery">${cells}</div>`);
    }
    playSfx('beep', i);
  },
  stars: ({ stage, px, py }) => { stage.addStar(px, py); playSfx('twinkle'); },
  moon: ({ stage }) => {
    const cur = MOONS.indexOf(stage.currentArt.moon ?? 'crescent');
    const next = MOONS[Math.min(MOONS.length - 1, Math.max(0, cur) + 1)];
    stage.overlay('#0d1235', 0.3, 'night');
    setTimeout(() => { stage.patch({ moon: next }); stage.overlay('#0d1235', 0, 'night'); }, 380);
    playSfx('chime');
  },
  giggle: ({ stage }) => { stage.bump('robot', 'giggle-once', 900); playSfx('giggle'); },
  twinkle: ({ stage, px, py }) => { stage.sparkle(px, py, { color: C.star, count: 7, size: 54 }); stage.el.classList.remove('twinkle-all'); void stage.el.offsetWidth; stage.el.classList.add('twinkle-all'); playSfx('twinkle'); },
  sunset: ({ stage, i, count }) => {
    if (i === 1) stage.patch({ time: 'sunset' });
    stage.overlay(i < count ? '#ff9d6b' : '#1a1f4a', i < count ? 0.12 + i * 0.08 : 0.3, 'sky');
    playSfx('tap', count - i + 2);
  },
  sunrise: ({ stage, i, count }) => {
    stage.overlay('#ffcf6a', Math.min(0.6, 0.14 * i), 'horizon');
    if (i === count) stage.patch({ time: 'sunrise' });
    playSfx('tap', i + 3);
  },
  breeze: ({ stage, px, py }) => { stage.floatUp(px, py, 'ribbon'); setTimeout(() => stage.floatUp(px - 40, py + 30, 'ribbon'), 200); playSfx('breeze'); },
  clink: ({ stage }) => { stage.bump('spoon', 'wiggle-once', 700); playSfx('clink'); },
  dim: ({ stage, i }) => { stage.overlay('#1a1030', Math.min(0.36, 0.09 * i), 'dim'); playSfx('tap', 6 - i); },
};

/** Overlays that should stay after the tap moment ends. */
export const KEEP_OVERLAY = new Set(['dim']);

// ------------------------------------------------------------------ targets

export function targetsFor(name: string, stage: Stage): TargetSpec[] {
  const hits = (id: string) => stage.actorSpec(id)?.hits ?? [];
  switch (name) {
    case 'sock': return hits('prop:sock');
    case 'pillows': return hits('plants');
    case 'sprout': return hits('plants').slice(1, 2);
    case 'pouch': return hits('prop:pouch');
    case 'panel': return hits('suncatcher');
    case 'bolts': return ((stage.actorSpec('suncatcher') as any)?.bolts ?? []) as TargetSpec[];
    case 'lens': return hits('prop:telescope');
    case 'moon-chart': return hits('prop:moon-chart');
    case 'spoon': return hits('spoon');
    case 'count-stars': return stage.actors().filter((a) => a.id.startsWith('gstar')).flatMap((a) => a.hits ?? []);
    default: return [];
  }
}

export interface TargetCtx { stage: Stage; name: string; i: number; left: number; el: HTMLElement; order: number }

export function targetFx(c: TargetCtx) {
  const r = c.el.getBoundingClientRect(), sr = c.stage.el.getBoundingClientRect();
  const px = r.left - sr.left + r.width / 2, py = r.top - sr.top + r.height / 2;
  switch (c.name) {
    case 'sock': c.stage.sparkle(px, py); playSfx('whoosh'); break;
    case 'pillows': c.stage.sparkle(px, py, { color: '#c99a5c' }); playSfx('blup'); break;
    case 'pouch': {
      const plants = c.stage.actorSpec('plants');
      const k = 2 - c.left; // 0,1,2
      if (plants?.hits?.[k]) { const [tx, ty] = c.stage.px(plants.hits[k].x, plants.hits[k].y - 40); c.stage.floatUp(tx, ty, 'water'); }
      c.stage.floatUp(px, py, 'water');
      playSfx('blup');
      break;
    }
    case 'panel': {
      const el = c.stage.actor('suncatcher')?.querySelector('.anim');
      el?.classList.remove('wobble');
      c.stage.sparkle(px, py); playSfx('click');
      break;
    }
    case 'bolts': c.stage.sparkle(px, py, { count: 4 }); c.el.classList.add('turned'); playSfx('click'); setTimeout(() => playSfx('click'), 120); break;
    case 'sprout': c.stage.sparkle(px, py, { color: C.leaf1, count: 6 }); playSfx('chime'); break;
    case 'lens': c.stage.sparkle(px, py, { color: '#e8f4ff' }); playSfx('swish'); break;
    case 'moon-chart': c.stage.sparkle(px, py, { color: C.moon }); playSfx('target', c.order); c.el.classList.add('ring'); break;
    case 'spoon': c.stage.sparkle(px, py); playSfx('velcro'); break;
    case 'count-stars': {
      c.stage.sparkle(px, py, { color: '#fff1a8' });
      c.el.classList.add('counted');
      c.el.setAttribute('data-n', String(c.order + 1));
      playSfx('target', c.order);
      break;
    }
    default: c.stage.sparkle(px, py); playSfx('target', c.order);
  }
}
