// Things that float, glow, wobble and get tapped.
import { C, shade } from './palette.ts';
import { circle, ellipse, f, g, line, path, rect, rng, sparklePath, starPath, svgDoc } from './svg.ts';
import { moonSvg, spaceSvg, sunSvg, type MoonPhase } from './sky.ts';

export interface PropSpec {
  svg: string;
  /** fractional x of half-width, or absolute x when `ax` is set */
  fx?: number;
  ax?: number;
  y: number;
  w: number;
  h: number;
  z?: number;
  anim?: string;
  rot?: number;
  /** tap targets relative to the prop centre, in design units */
  targets?: { dx: number; dy: number; r: number; taps?: number }[];
  target?: string;
}

// ------------------------------------------------------------------ station exterior
export function stationSvg(lights: 'on' | 'off', litCount = 99): string {
  const id = 'solar';
  let s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a5aa8"/><stop offset="0.5" stop-color="#5a7fd0"/><stop offset="1" stop-color="#2f4a92"/></linearGradient></defs>`;
  // truss
  s += rect(60, 214, 880, 22, 6, '#b9c0cc') + rect(60, 220, 880, 6, 3, '#9aa3b2');
  // solar wings: two on each side
  for (const side of [-1, 1]) {
    for (const k of [0, 1]) {
      const x = 500 + side * (250 + k * 180) - 75;
      for (const up of [-1, 1]) {
        const y = up < 0 ? 40 : 250;
        s += rect(x + 66, up < 0 ? 200 : 236, 18, up < 0 ? 14 : 14, 3, '#9aa3b2');
        s += rect(x, y, 150, 160, 6, `url(#${id})`, 'stroke="#c4a454" stroke-width="5"');
        for (let i = 1; i < 6; i++) s += line(x + i * 25, y + 4, x + i * 25, y + 156, '#7f9be0', 2);
        for (let j = 1; j < 6; j++) s += line(x + 4, y + j * 26.6, x + 146, y + j * 26.6, '#7f9be0', 2);
        s += path(`M${x + 10} ${y + 12} l40 0 l-20 40 l-40 0z`, '#ffffff', 'opacity="0.15" class="glint"');
      }
    }
  }
  // radiators
  s += rect(430, 250, 26, 90, 4, '#f4f1ea') + rect(544, 250, 26, 90, 4, '#f4f1ea');
  // modules
  const mod = (x: number, w: number, h: number, col: string) =>
    rect(x, 225 - h / 2, w, h, h / 2.2, col, `stroke="${shade(col, -0.15)}" stroke-width="4"`) +
    rect(x + 10, 225 - h / 2 + 8, w - 20, 8, 4, '#ffffff', 'opacity="0.5"');
  s += mod(330, 120, 86, '#eef0f4') + mod(440, 130, 100, '#f6f3ea') + mod(560, 110, 86, '#eef0f4') + mod(660, 70, 70, '#e6e9f0');
  s += mod(270, 70, 64, '#e6e9f0');
  // cupola under the middle module
  s += path('M478 272 h44 l12 26 h-68z', '#dfe3ea', 'stroke="#98a2b3" stroke-width="3"') + rect(486, 278, 28, 14, 4, '#7fb2e8');
  // little supply ship docked on the right
  s += rect(728, 205, 70, 40, 18, '#f2e6d6', 'stroke="#c9b998" stroke-width="3"') + circle(800, 225, 14, '#c9b998');
  // windows
  const wins: [number, number][] = [[350, 225], [380, 225], [470, 225], [500, 225], [530, 225], [585, 225], [615, 225], [295, 225]];
  wins.forEach(([x, y], i) => {
    const lit = lights === 'on' && i < litCount;
    s += circle(x, y, 10, lit ? '#ffe08a' : '#3a4170', `class="win${lit ? ' lit' : ''}" data-i="${i}"`);
    if (lit) s += circle(x, y, 18, '#ffe08a', 'opacity="0.25"');
  });
  return svgDoc('0 0 1000 460', s);
}

// ------------------------------------------------------------------ hub props
const sockSvg = () => svgDoc('0 0 120 120',
  path('M40 14 h34 v48 q0 10 8 16 l18 14 q10 9 0 18 q-8 6 -18 0 l-30 -20 q-12 -8 -12 -22z', C.white, `stroke="#d7d0c2" stroke-width="3"`) +
  rect(40, 14, 34, 12, 4, C.coral) + rect(40, 32, 34, 7, 3, C.sky));

function sunCatcherSvg(state: 'ok' | 'wobbly' | 'fixed-off' | 'wall' | 'on'): string {
  const on = state === 'ok' || state === 'on';
  const tilt = state === 'wobbly' ? -18 : state === 'wall' ? 0 : 0;
  const flip = state === 'wall';
  const panel = g(
    rect(30, 20, 180, 120, 10, '#3e5fae', `stroke="#c4a454" stroke-width="6"`) +
    [1, 2, 3].map((i) => line(30 + i * 45, 24, 30 + i * 45, 136, '#7f9be0', 3)).join('') +
    line(34, 80, 206, 80, '#7f9be0', 3) +
    path('M44 30 l40 0 l-22 44 l-40 0z', '#ffffff', 'opacity="0.15"') +
    // bolts
    [[44, 34], [196, 34], [120, 128]].map(([x, y]) => circle(x, y, 9, C.metal) + line(x - 5, y, x + 5, y, C.metalDark, 3)).join(''),
    flip ? 'transform="translate(240 0) scale(-0.45 1)"' : `transform="rotate(${tilt} 120 150)"`);
  const stand = rect(108, 140, 24, 60, 6, C.metalDark) + rect(70, 196, 100, 20, 8, C.metal);
  const light = circle(150, 206, 9, on ? '#5ee07a' : '#4a5a50') + (on ? circle(150, 206, 20, '#5ee07a', 'opacity="0.3"') : '');
  return svgDoc('0 0 240 230', stand + panel + light);
}

function portholeSvg(): string {
  const sp = spaceSvg(400, { seed: 23, top: -150, bottom: 150 });
  return svgDoc('-140 -140 280 280',
    `<defs><clipPath id="ph"><circle r="110"/></clipPath></defs>` +
    `<g clip-path="url(#ph)">${sp.svg}${sunSvg(30, -20, 34)}</g>` +
    circle(0, 0, 118, 'none', `stroke="${C.metal}" stroke-width="22"`) + circle(0, 0, 130, 'none', `stroke="${C.metalDark}" stroke-width="4"`) +
    path('M-70 -50 q30 -40 70 -40', 'none', 'stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.2"'));
}

const curtainSvg = () => svgDoc('0 0 280 460',
  rect(0, 0, 280, 22, 10, C.metalDark) +
  path('M10 20 q20 210 0 430 h260 q-20 -220 0 -430z', '#a98bd8') +
  [50, 100, 150, 200, 240].map((x) => path(`M${x} 26 q14 200 0 420`, 'none', `stroke="#8f72c4" stroke-width="6"`)).join(''));

const ballSvg = () => svgDoc('0 0 100 100', circle(50, 50, 44, C.coral) + path('M10 50 q40 -30 80 0', 'none', `stroke="${C.sunflower}" stroke-width="10"`) + path('M14 66 q36 -24 72 0', 'none', `stroke="${C.white}" stroke-width="6"`) + circle(36, 32, 8, '#fff', 'opacity="0.5"'));

const tortillaSvg = () => svgDoc('0 0 140 100', ellipse(70, 50, 62, 34, '#f1d9a2') + ellipse(70, 50, 62, 34, 'none', 'stroke="#d8b46e" stroke-width="4"') +
  [[45, 40], [80, 35], [95, 58], [60, 62], [72, 48]].map(([x, y]) => circle(x, y, 4, '#c9964d', 'opacity="0.7"')).join(''));

const notesSvg = () => svgDoc('0 0 200 160',
  [[40, 90, C.lavender], [110, 50, C.coral], [160, 100, C.teal]].map(([x, y, c]) =>
    ellipse(x as number, y as number, 14, 10, c as string, `transform="rotate(-20 ${x} ${y})"`) + line((x as number) + 12, y as number, (x as number) + 12, (y as number) - 46, c as string, 5)).join(''));

const bagSvg = () => svgDoc('0 0 240 210', rect(10, 20, 220, 180, 40, C.bagBlue) + rect(30, 40, 180, 30, 14, shade(C.bagBlue, 0.25)) + rect(100, 6, 40, 30, 10, shade(C.bagBlue, -0.2)) + path('M40 120 h160', 'none', `stroke="${shade(C.bagBlue, -0.15)}" stroke-width="6" stroke-dasharray="10 8"`));

const tableSvg = () => svgDoc('0 0 280 220', rect(10, 30, 260, 34, 12, '#c9b998') + rect(20, 24, 240, 12, 6, '#ddd0b4') + rect(40, 60, 18, 150, 8, C.metalDark) + rect(222, 60, 18, 150, 8, C.metalDark) + rect(60, 10, 60, 18, 6, C.velcro));

const spoonSvg = () => svgDoc('0 0 140 140', `<g class="wiggle" style="transform-origin:70px 70px">` + ellipse(40, 40, 20, 26, '#d7dde6', 'transform="rotate(-45 40 40)"') + line(55, 55, 118, 118, '#c7ced9', 10) + '</g>');

const flashGlowSvg = () => svgDoc('0 0 300 300', `<defs><radialGradient id="fl"><stop offset="0" stop-color="#fff3c2" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>` + circle(150, 150, 150, 'url(#fl)'));

const pouchSvg = (straw = true) => svgDoc('0 0 140 180', rect(20, 30, 100, 140, 24, '#d9eefc', 'stroke="#a8c8e0" stroke-width="4" opacity="0.95"') + rect(28, 90, 84, 72, 18, C.water, 'opacity="0.75"') +
  (straw ? rect(62, 4, 16, 36, 6, C.coral) : rect(58, 10, 24, 26, 8, C.metal)) + path('M34 46 h20', 'none', 'stroke="#fff" stroke-width="6" stroke-linecap="round"'));

const waterBallSvg = () => svgDoc('0 0 120 120', `<g class="jiggle" style="transform-origin:60px 60px">` + circle(60, 60, 44, C.water, 'opacity="0.85"') + circle(60, 60, 44, 'none', `stroke="${C.water2}" stroke-width="5"`) + ellipse(44, 42, 14, 9, '#fff', 'opacity="0.7"') + '</g>');

const drawingSvg = () => svgDoc('0 0 220 180', rect(10, 10, 200, 160, 10, '#fffdf6', 'stroke="#e2d6bf" stroke-width="4" transform="rotate(-4 110 90)"') +
  circle(160, 54, 22, C.sunflower) + path('M150 50 q4 4 8 0 M162 50 q4 4 8 0 M152 62 q8 8 16 0', 'none', `stroke="${C.ink}" stroke-width="3" stroke-linecap="round" fill="none"`) +
  path('M50 150 q-10 -50 10 -80 M70 150 q0 -40 20 -60 M90 150 q10 -30 30 -40', 'none', `stroke="${C.leaf0}" stroke-width="8" stroke-linecap="round" fill="none"`) +
  // Button's "very square circle"
  rect(36, 34, 46, 44, 6, 'none', `stroke="${C.teal}" stroke-width="5"`));

const drinkSvg = () => pouchSvg(true);

// ------------------------------------------------------------------ dock
const boxSvg = (seed: number) => {
  const r = rng(seed);
  return svgDoc('0 0 140 120', rect(10, 14, 120, 94, 14, r() > 0.5 ? '#f4f1ea' : '#ece2cf', 'stroke="#c9bfa9" stroke-width="4"') + rect(10, 50, 120, 14, 0, '#d7cdb8') + rect(54, 24, 32, 18, 4, C.velcro));
};

// ------------------------------------------------------------------ garden
export type PlantKind = 'lettuce' | 'zinnia';

function plantShape(kind: PlantKind, stage: number, x: number, base: number): string {
  if (stage <= 0) return '';
  if (stage === 1) return path(`M${x} ${base} q-4 -26 6 -40`, 'none', `stroke="${C.leaf0}" stroke-width="6" stroke-linecap="round"`) +
    ellipse(x + 12, base - 42, 12, 7, C.leaf1, `transform="rotate(-30 ${x + 12} ${base - 42})"`) + ellipse(x - 4, base - 38, 10, 6, C.leaf1, `transform="rotate(30 ${x - 4} ${base - 38})"`);
  if (kind === 'lettuce') {
    const n = stage === 2 ? 5 : 9;
    const L = stage === 2 ? 46 : 92;
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32;
      const lx = x + Math.cos(a) * L * 0.55, ly = base + Math.sin(a) * L * 0.55;
      const col = i % 3 === 0 ? C.leafRed : i % 2 ? C.leaf0 : C.leaf1;
      s += ellipse(lx, ly, L * 0.28, L * 0.5, col, `transform="rotate(${f((a * 180) / Math.PI + 90)} ${f(lx)} ${f(ly)})"`);
    }
    return s + ellipse(x, base - 6, L * 0.35, 12, C.leaf2);
  }
  // zinnia
  const h = stage === 2 ? 60 : 130;
  let s = path(`M${x} ${base} q-6 ${-h / 2} 0 ${-h}`, 'none', `stroke="${C.leaf2}" stroke-width="7" stroke-linecap="round"`);
  s += ellipse(x - 16, base - h * 0.35, 16, 8, C.leaf0, `transform="rotate(25 ${x - 16} ${base - h * 0.35})"`) + ellipse(x + 15, base - h * 0.55, 16, 8, C.leaf1, `transform="rotate(-25 ${x + 15} ${base - h * 0.55})"`);
  if (stage >= 3) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      s += ellipse(x + Math.cos(a) * 22, base - h + Math.sin(a) * 22, 15, 8, i % 2 ? C.petal : C.petal2, `transform="rotate(${f((a * 180) / Math.PI)} ${f(x + Math.cos(a) * 22)} ${f(base - h + Math.sin(a) * 22)})"`);
    }
    s += circle(x, base - h, 14, '#e0682a') + circle(x, base - h, 7, C.sunflower);
  } else {
    s += circle(x, base - h, 10, C.leaf0);
  }
  return s;
}

/** The three plant pillows in the garden, with plants at a growing stage. */
export function plantsSvg(kind: PlantKind, stage: number, opts: { seeded?: boolean; roots?: boolean; droopy?: number } = {}): string {
  let s = '';
  for (const i of [-1, 0, 1]) {
    const x = 230 + i * 130, base = 250;
    if (opts.roots) s += path(`M${x} ${base + 30} q-8 30 4 60 M${x} ${base + 40} q14 20 8 46`, 'none', `stroke="#c9a77a" stroke-width="4" stroke-linecap="round"`);
    s += ellipse(x, base + 42, 56, 40, C.pillowShade) + ellipse(x, base + 36, 54, 36, C.pillow) + path(`M${x - 40} ${base + 30} q40 -14 80 0`, 'none', `stroke="${C.pillowShade}" stroke-width="3"`);
    if (opts.seeded && stage === 0) s += circle(x - 8, base + 28, 5, '#9a6b3c') + circle(x + 9, base + 31, 5, '#9a6b3c');
    s += plantShape(kind, stage, x, base + 24);
  }
  return svgDoc('0 0 460 360', s);
}

const seedPacketSvg = (kind: PlantKind) => svgDoc('0 0 130 160', rect(10, 10, 110, 140, 10, '#fffaf0', 'stroke="#d9cdb3" stroke-width="4" transform="rotate(8 65 80)"') +
  `<g transform="rotate(8 65 80)">` + (kind === 'lettuce' ? ellipse(65, 70, 34, 26, C.leaf1) + ellipse(56, 66, 16, 22, C.leafRed, 'opacity="0.7"') : circle(65, 70, 26, C.petal) + circle(65, 70, 10, C.sunflower)) +
  rect(30, 112, 70, 12, 6, C.inkSoft, 'opacity="0.35"') + '</g>');

const seedPeekSvg = () => svgDoc('0 0 120 120', ellipse(60, 50, 16, 11, '#9a6b3c') + path('M60 60 q-6 18 4 36', 'none', 'stroke="#d9c39a" stroke-width="3" stroke-linecap="round"'));

const harvestLettuceSvg = () => svgDoc('0 0 180 150', ellipse(90, 110, 70, 28, '#f1e3c9') + plantShape('lettuce', 3, 90, 105).replace(/ellipse cx/g, 'ellipse cx'));
const flowerSvg = () => svgDoc('0 0 120 120', plantShape('zinnia', 3, 60, 200).replace(/translate/g, 'translate'));

// ------------------------------------------------------------------ cupola
const telescopeSvg = () => svgDoc('0 0 280 220',
  rect(126, 120, 22, 80, 8, C.metalDark) + path('M90 210 l50 -20 l50 20z', C.metal) +
  `<g transform="rotate(-24 140 110)">` + rect(40, 86, 200, 48, 22, '#f4f1ea', `stroke="${C.metalDark}" stroke-width="5"`) + rect(220, 80, 30, 60, 10, C.coral) + rect(16, 98, 32, 24, 8, C.ink) + circle(246, 110, 22, '#9fc6ff', 'opacity="0.8" class="lens"') + '</g>');

export function moonChartSvg(filled: number): string {
  const phases: MoonPhase[] = ['crescent', 'half', 'gibbous', 'full'];
  let s = rect(10, 10, 260, 320, 12, '#fffdf6', `stroke="#d9cdb3" stroke-width="5"`) + rect(110, 0, 60, 20, 6, C.velcro);
  phases.forEach((p, i) => {
    const x = 75 + (i % 2) * 130, y = 100 + Math.floor(i / 2) * 140;
    s += circle(x, y, 48, '#f1ead8') + circle(x, y, 48, 'none', `stroke="#d9cdb3" stroke-width="3" stroke-dasharray="6 6"`);
    if (i < filled) s += moonSvg(x, y, 40, p);
  });
  return svgDoc('0 0 280 340', s);
}

// ------------------------------------------------------------------ sleep
const glowStarSvg = () => svgDoc('0 0 120 120', path(starPath(60, 60, 50), '#fff1a8', 'opacity="0.95"') + path(starPath(60, 60, 50), 'none', 'stroke="#ffd96a" stroke-width="5" stroke-linejoin="round"'));

// ------------------------------------------------------------------ tunnel
const waterMachineSvg = () => svgDoc('0 0 320 320',
  rect(30, 40, 260, 250, 22, '#f2f4f7', `stroke="#c3cad6" stroke-width="6"`) + rect(50, 60, 220, 60, 12, '#e3e8ef') +
  [0, 1, 2, 3].map((i) => circle(80 + i * 50, 90, 10, '#5ee07a', `class="blink-light" style="animation-delay:${i * 0.4}s"`)).join('') +
  path('M40 200 h-40 M280 230 h40', 'none', `stroke="${C.metalDark}" stroke-width="18" stroke-linecap="round"`) +
  circle(160, 210, 46, '#d9eefc', 'stroke="#a8c8e0" stroke-width="6"') + circle(150, 200, 10, C.water, 'class="bubble-up"') + circle(172, 222, 7, C.water, 'class="bubble-up" style="animation-delay:.8s"'));

// ------------------------------------------------------------------ blanket
export function blanketSvg(eyes: number): string {
  let s = path('M10 250 q-10 -150 120 -190 q120 -40 240 10 q120 60 100 180 q-20 30 -60 10 q-40 30 -90 0 q-50 30 -100 0 q-50 30 -100 0 q-60 20 -110 -10z', '#e7a3c9') +
    path('M60 120 q140 -50 300 0', 'none', 'stroke="#f6c7e0" stroke-width="10" stroke-linecap="round"');
  for (let i = 0; i < eyes; i++) {
    const x = 120 + i * 110, y = 170 + (i % 2) * 18;
    s += ellipse(x - 14, y, 9, 11, C.white) + ellipse(x + 14, y, 9, 11, C.white) + circle(x - 12, y + 2, 5, C.ink) + circle(x + 16, y + 2, 5, C.ink);
  }
  return svgDoc('0 0 480 280', s);
}

// ------------------------------------------------------------------ the prop table
export interface PropCtx { place: string; plant: PlantKind; moonFill: number; bedtime: boolean }

export function propSpec(name: string, ctx: PropCtx): PropSpec | null {
  switch (name) {
    case 'sock': return { svg: sockSvg(), fx: 0.32, y: 300, w: 120, h: 120, anim: 'drift', z: 30, target: 'sock', targets: [{ dx: 0, dy: 0, r: 75 }] };
    case 'sock-caught': return { svg: sockSvg(), fx: 0.2, y: 470, w: 90, h: 90, anim: 'bob', z: 30 };
    case 'sock-velcro': return { svg: sockSvg(), ax: 180, y: 300, w: 80, h: 80, rot: 12, z: 5 };
    case 'window-sun': return { svg: portholeSvg(), fx: -0.62, y: 330, w: 250, h: 250, z: 4 };
    case 'suncatcher-ok': return { svg: sunCatcherSvg('ok'), fx: -0.62, y: 560, w: 240, h: 230, z: 6 };
    case 'suncatcher-on': return { svg: sunCatcherSvg('on'), fx: -0.62, y: 560, w: 240, h: 230, z: 6 };
    case 'suncatcher-fixed-off': return { svg: sunCatcherSvg('fixed-off'), fx: -0.62, y: 560, w: 240, h: 230, z: 6 };
    case 'suncatcher-wall': return { svg: sunCatcherSvg('wall'), fx: -0.62, y: 560, w: 240, h: 230, z: 6 };
    case 'suncatcher-wobbly': return {
      svg: sunCatcherSvg('wobbly'), fx: -0.62, y: 560, w: 240, h: 230, z: 6, anim: 'wobble',
      // panel to hold steady, then three bolts
      targets: [{ dx: 0, dy: -45, r: 95 }],
    };
    case 'curtain': return { svg: curtainSvg(), fx: -0.62, y: 450, w: 290, h: 470, z: 8 };
    case 'ball': return { svg: ballSvg(), fx: -0.15, y: 250, w: 90, h: 90, anim: 'drift', z: 30 };
    case 'tortillas': return { svg: tortillaSvg(), fx: 0.18, y: 250, w: 140, h: 100, anim: 'drift', z: 30 };
    case 'notes': return { svg: notesSvg(), fx: 0.05, y: 260, w: 220, h: 170, anim: 'drift', z: 30 };
    case 'bag': return { svg: bagSvg(), fx: -0.66, y: 640, w: 240, h: 210, z: 6 };
    case 'table': return { svg: tableSvg(), fx: 0.6, y: 760, w: 280, h: 220, z: 6 };
    case 'spoon-bag': return { svg: spoonSvg(), fx: -0.5, y: 520, w: 120, h: 120, z: 31, anim: 'drift', targets: [{ dx: 0, dy: 0, r: 75 }] };
    case 'spoon-table': return { svg: spoonSvg(), fx: 0.5, y: 650, w: 120, h: 120, z: 31, anim: 'drift', targets: [{ dx: 0, dy: 0, r: 75 }] };
    case 'spoon-velcro': return { svg: spoonSvg(), ax: -170, y: 300, w: 90, h: 90, rot: -20, z: 5 };
    case 'flashlight-on': return { svg: flashGlowSvg(), ax: 40, y: 380, w: 420, h: 420, z: 3, anim: 'glow' };
    case 'drink-pouch': return { svg: drinkSvg(), fx: 0.22, y: 330, w: 110, h: 140, anim: 'drift', z: 30 };
    case 'drawing': return { svg: drawingSvg(), fx: 0.3, y: 290, w: 220, h: 180, anim: 'drift', z: 30 };
    case 'boxes': return { svg: '', y: 0, w: 0, h: 0 }; // expanded by the composer
    case 'pouch': return { svg: pouchSvg(false), fx: 0.36, y: 360, w: 130, h: 170, anim: 'bob', z: 30, targets: [{ dx: 0, dy: 0, r: 85, taps: 3 }] };
    case 'water-ball': return { svg: waterBallSvg(), fx: 0.18, y: 300, w: 110, h: 110, anim: 'drift', z: 31 };
    case 'seed-peek': return { svg: seedPeekSvg(), ax: 0, y: 330, w: 110, h: 110, anim: 'bob', z: 31 };
    case 'seed-packet-lettuce': return { svg: seedPacketSvg('lettuce'), fx: 0.34, y: 300, w: 120, h: 150, anim: 'drift', z: 30 };
    case 'seed-packet-zinnia': return { svg: seedPacketSvg('zinnia'), fx: 0.34, y: 300, w: 120, h: 150, anim: 'drift', z: 30 };
    case 'harvest-lettuce': return { svg: harvestLettuceSvg(), fx: 0.05, y: 300, w: 180, h: 150, anim: 'drift', z: 30 };
    case 'harvest-zinnia': return { svg: flowerSvg(), fx: 0.62, y: 330, w: 90, h: 90, z: 40, rot: 20 };
    case 'telescope': return { svg: telescopeSvg(), fx: 0.62, y: 620, w: 280, h: 220, z: 9, targets: [{ dx: 92, dy: -62, r: 80, taps: 3 }] };
    case 'moon-chart': return {
      svg: moonChartSvg(ctx.moonFill), fx: -0.66, y: 270, w: 250, h: 304, z: 5,
      targets: [0, 1, 2, 3].map((i) => ({ dx: (75 + (i % 2) * 130 - 140) * (250 / 280), dy: (100 + Math.floor(i / 2) * 140 - 170) * (304 / 340), r: 60 })),
    };
    case 'count-stars': return null; // expanded by the composer
    case 'water-machine': return { svg: waterMachineSvg(), fx: 0.6, y: 480, w: 320, h: 320, z: 5 };
    default: return null;
  }
}

export const GLOW_STARS: [number, number][] = [[-0.72, 150], [-0.42, 92], [-0.12, 160], [0.14, 96], [-0.3, 250]];
export { glowStarSvg, boxSvg, sparklePath };
