// The places on Star Station. Each place gives two layers:
//   back: the outside world (seen through windows)
//   room: the inside of the station, with holes where the windows are
// Coordinates: height 1000, width W, x = 0 in the middle.
import { C, shade } from './palette.ts';
import { circle, ellipse, f, line, path, poly, rect, rng } from './svg.ts';
import { earthSvg, moonSvg, spaceSvg, sunSvg, type MoonPhase, type Twinkle, type EarthTime } from './sky.ts';

export const PLACES = ['orbit', 'hub', 'dock', 'cupola', 'garden', 'sleep', 'tunnel'] as const;
export const TIMES = ['day', 'night', 'sunset', 'sunrise'] as const;

export interface PlaceOpts {
  W: number;
  time: string;
  lights: string;
  moon: MoonPhase;
  props: Set<string>;
  bedtime: boolean;
}

export interface PlaceLayers {
  back: string;
  room: string;
  twinkles: Twinkle[];
  /** a soft colour wash over everything (night, bedtime) */
  wash?: { color: string; opacity: number };
}

// ---------------------------------------------------------------- palettes
interface WallPal { ceil: string; wallL: string; wallR: string; floor: string; back: string; line: string; inset: string; lamp: string; lampOn: boolean }

function wallPal(time: string, lights: string): WallPal {
  const night = time === 'night' || lights === 'bedtime' || lights === 'bedtime-dim' || lights === 'off';
  if (night) {
    return { ceil: C.night0, wallL: C.night1, wallR: C.night1, floor: C.night2, back: '#424a7c', line: C.nightLine, inset: '#353c6b', lamp: C.nightLamp, lampOn: lights !== 'off' };
  }
  return { ceil: C.wall0, wallL: C.wall1, wallR: C.wall1, floor: C.wall2, back: '#efe5d1', line: C.panelLine, inset: '#e3d7bf', lamp: C.lamp, lampOn: lights !== 'off' };
}

function partyColor(lights: string): { color: string; n: number } | null {
  if (lights === 'yellow') return { color: C.partyYellow, n: 99 };
  if (lights === 'blue') return { color: C.partyBlue, n: 99 };
  const m = /^party:(\w+):(\d+)$/.exec(lights);
  if (m) return { color: m[1] === 'blue' ? C.partyBlue : C.partyYellow, n: Number(m[2]) };
  return null;
}

// ---------------------------------------------------------- module interior
const VP = { x: 0, y: 430 };
const BACK = { x0: -270, x1: 270, y0: 230, y1: 630 };
const DEPTHS = [1, 1.32, 1.8, 2.5, 3.6, 5.4];
type Wall = 'top' | 'bottom' | 'left' | 'right';

function wp(wall: Wall, u: number, s: number): [number, number] {
  let bx: number, by: number;
  if (wall === 'top') { bx = BACK.x0 + (BACK.x1 - BACK.x0) * u; by = BACK.y0; }
  else if (wall === 'bottom') { bx = BACK.x0 + (BACK.x1 - BACK.x0) * u; by = BACK.y1; }
  else if (wall === 'left') { bx = BACK.x0; by = BACK.y0 + (BACK.y1 - BACK.y0) * u; }
  else { bx = BACK.x1; by = BACK.y0 + (BACK.y1 - BACK.y0) * u; }
  return [VP.x + (bx - VP.x) * s, VP.y + (by - VP.y) * s];
}

function quad(wall: Wall, u0: number, u1: number, s0: number, s1: number): [number, number][] {
  return [wp(wall, u0, s0), wp(wall, u1, s0), wp(wall, u1, s1), wp(wall, u0, s1)];
}

function moduleInterior(pal: WallPal, opts: PlaceOpts, seed = 3): string {
  const r = rng(seed);
  let s = '';
  const walls: [Wall, string][] = [['top', pal.ceil], ['bottom', pal.floor], ['left', pal.wallL], ['right', pal.wallR]];
  for (const [wall, col] of walls) {
    for (let i = 0; i < DEPTHS.length - 1; i++) {
      const s0 = DEPTHS[i], s1 = DEPTHS[i + 1];
      const cols = wall === 'top' || wall === 'bottom' ? [0, 0.5, 1] : [0, 0.5, 1];
      for (let j = 0; j < cols.length - 1; j++) {
        const u0 = cols[j], u1 = cols[j + 1];
        const base = (i + j) % 2 ? col : shade(col, -0.03);
        s += poly(quad(wall, u0, u1, s0, s1), base, `stroke="${pal.line}" stroke-width="${f(1.5 * s0)}"`);
        // rack panel inset
        const ia = s0 + (s1 - s0) * 0.12, ib = s1 - (s1 - s0) * 0.12;
        s += poly(quad(wall, u0 + 0.07, u1 - 0.07, ia, ib), pal.inset, `opacity="0.75"`);
        // little latch
        const [lx, ly] = wp(wall, (u0 + u1) / 2, (ia + ib) / 2);
        s += circle(lx, ly, 3.2 * s0, pal.line);
        // velcro patches here and there
        if (r() > 0.55) {
          const uu = u0 + 0.15 + r() * 0.2, ss = ia + (ib - ia) * (0.2 + r() * 0.4);
          s += poly(quad(wall, uu, uu + 0.08, ss, ss + (ib - ia) * 0.18), C.velcro, 'opacity="0.9"');
        }
      }
    }
  }
  // corner seams
  for (const [x, y] of [[BACK.x0, BACK.y0], [BACK.x1, BACK.y0], [BACK.x0, BACK.y1], [BACK.x1, BACK.y1]])
    s += line(x, y, VP.x + (x - VP.x) * 5.4, VP.y + (y - VP.y) * 5.4, shade(pal.line, -0.1), 6);
  // ceiling light strips
  for (const u of [0.18, 0.82]) {
    const pts = [wp('top', u - 0.05, 1.05), wp('top', u + 0.05, 1.05), wp('top', u + 0.05, 5.2), wp('top', u - 0.05, 5.2)];
    s += poly(pts, pal.lampOn ? pal.lamp : shade(pal.ceil, -0.08), pal.lampOn ? '' : 'opacity="0.9"');
  }
  // handrails on the side walls
  for (const wall of ['left', 'right'] as Wall[]) {
    for (const u of [0.28, 0.74]) {
      for (let i = 1; i < DEPTHS.length - 1; i += 2) {
        const a = wp(wall, u, DEPTHS[i] + 0.05), b = wp(wall, u, DEPTHS[i + 1] - 0.05);
        const w = 5 * (DEPTHS[i] + DEPTHS[i + 1]) / 2;
        s += line(a[0], a[1], b[0], b[1], C.railDark, w + 3) + line(a[0], a[1], b[0], b[1], C.rail, w);
      }
    }
  }
  // cables
  const c1 = wp('left', 0.92, 1.3), c2 = wp('left', 0.9, 3.4);
  s += path(`M${f(c1[0])} ${f(c1[1])} Q${f(c1[0] - 60)} ${f(c2[1] - 40)} ${f(c2[0])} ${f(c2[1])}`, 'none', `stroke="${C.cable}" stroke-width="7" stroke-linecap="round" opacity="0.8"`);
  // laptop on the right wall, bags on the left
  const lp = wp('right', 0.36, 1.55);
  s += `<g transform="translate(${f(lp[0])} ${f(lp[1])}) skewY(18)">` + rect(-6, -40, 66, 46, 6, '#3d4566') + rect(0, -34, 54, 34, 3, opts.time === 'night' ? '#5b8fd0' : C.screenGlow, 'opacity="0.85"') + '</g>';
  const bg = wp('left', 0.5, 1.7);
  s += `<g transform="translate(${f(bg[0])} ${f(bg[1])}) skewY(-20)">` + rect(-70, -40, 60, 74, 16, C.bagBlue) + rect(-62, -28, 44, 8, 4, shade(C.bagBlue, 0.3)) + '</g>';
  const bg2 = wp('left', 0.12, 2.1);
  s += `<g transform="translate(${f(bg2[0])} ${f(bg2[1])}) skewY(-22)">` + rect(-90, -10, 80, 60, 16, C.bagOrange) + '</g>';
  // party lights along the ceiling edges
  const party = partyColor(opts.lights);
  if (party) {
    let k = 0;
    for (const u of [0.02, 0.98]) {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const sDepth = 1.1 + (i / (n - 1)) * 3.6;
        const [x, y] = wp('top', u, sDepth);
        const group = Math.floor(i / 2);
        const on = group < party.n;
        const rr = 7.5 * sDepth;
        s += line(x, y - rr * 1.6, x, y - rr * 0.6, C.cable, 2 * sDepth);
        if (on) s += circle(x, y, rr * 2.4, party.color, 'opacity="0.25"');
        s += circle(x, y, rr, on ? party.color : shade(party.color, -0.45));
        k++;
      }
    }
    // a garland across the back wall
    const n = 9;
    s += path(`M${BACK.x0 + 16} ${BACK.y0 + 30} Q0 ${BACK.y0 + 110} ${BACK.x1 - 16} ${BACK.y0 + 30}`, 'none', `stroke="${C.cable}" stroke-width="4"`);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = BACK.x0 + 16 + t * (BACK.x1 - BACK.x0 - 32);
      const y = BACK.y0 + 30 + 4 * t * (1 - t) * 80 + 14;
      const on = Math.floor(i / 2) < party.n;
      if (on) s += circle(x, y, 26, party.color, 'opacity="0.28"');
      s += ellipse(x, y, 11, 14, on ? party.color : shade(party.color, -0.45));
    }
  }
  return s;
}

function backWallFrame(pal: WallPal): string {
  return rect(BACK.x0, BACK.y0, BACK.x1 - BACK.x0, BACK.y1 - BACK.y0, 6, pal.back, `stroke="${pal.line}" stroke-width="4"`) +
    rect(BACK.x0 + 16, BACK.y0 + 14, BACK.x1 - BACK.x0 - 32, BACK.y1 - BACK.y0 - 28, 30, 'none', `stroke="${pal.line}" stroke-width="3" opacity="0.6"`);
}

function hatchSvg(r: number, opts: PlaceOpts, pal: WallPal, open: boolean, glow: boolean): string {
  const cx = VP.x, cy = VP.y;
  let s = circle(cx, cy, r + 26, C.metal) + circle(cx, cy, r + 26, 'none', `stroke="${C.metalDark}" stroke-width="5"`);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    s += circle(cx + Math.cos(a) * (r + 13), cy + Math.sin(a) * (r + 13), 5, C.metalDark);
  }
  if (open) {
    const id = `hg${glow ? 'g' : 'n'}`;
    s += `<defs><radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${glow ? '#9fdcff' : '#4a5385'}"/><stop offset="1" stop-color="${glow ? '#3a7fd0' : '#1f2448'}"/></radialGradient></defs>`;
    s += circle(cx, cy, r, `url(#${id})`);
    // the next module, smaller
    s += circle(cx, cy, r * 0.62, 'none', `stroke="${glow ? '#cdeeff' : '#5a6396'}" stroke-width="6" opacity="0.6"`);
    if (glow) s += circle(cx, cy, r * 0.42, '#e8f7ff', 'opacity="0.55"') + ellipse(cx, cy + r * 0.3, r * 0.5, r * 0.18, C.ocean1, 'opacity="0.6"');
  } else {
    s += circle(cx, cy, r, C.hatch) + circle(cx, cy, r * 0.82, 'none', `stroke="${C.hatchDark}" stroke-width="4"`) +
      circle(cx, cy - r * 0.35, r * 0.2, '#9fb3d6', `stroke="${C.hatchDark}" stroke-width="4"`) +
      rect(cx - r * 0.45, cy + r * 0.2, r * 0.9, 16, 8, C.metalDark);
  }
  void pal; void opts;
  return s;
}

function gardenChamber(opts: PlaceOpts, pal: WallPal): string {
  const x0 = -230, x1 = 230, y0 = 268, y1 = 604;
  // lights: 'garden-off' (chamber dark), 'grow:k' (switching on, k of 3), anything else lit
  const g = /^grow:(\d)$/.exec(opts.lights);
  const frac = opts.lights === 'garden-off' ? 0 : g ? Number(g[1]) / 3 : 1;
  let s = rect(x0 - 18, y0 - 18, x1 - x0 + 36, y1 - y0 + 36, 26, C.metal, `stroke="${C.metalDark}" stroke-width="5"`);
  s += `<defs><linearGradient id="gch0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5a86"/><stop offset="1" stop-color="#463d63"/></linearGradient>` +
    `<linearGradient id="gch1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4b2e6"/><stop offset="1" stop-color="#a87ee8"/></linearGradient></defs>`;
  s += rect(x0, y0, x1 - x0, y1 - y0, 14, 'url(#gch0)');
  if (frac > 0) s += rect(x0, y0, x1 - x0, y1 - y0, 14, 'url(#gch1)', `opacity="${f(frac)}"`);
  // LED bar
  s += rect(x0 + 10, y0 + 6, x1 - x0 - 20, 26, 10, '#3d3f5c');
  const litLeds = Math.round(16 * frac);
  for (let i = 0; i < 16; i++) {
    const x = x0 + 26 + i * 26.5;
    s += circle(x, y0 + 19, 6, i < litLeds ? (i % 3 === 1 ? C.growBlue : C.growRed) : '#5a5c7a');
  }
  void pal;
  return s;
}

// ---------------------------------------------------------- the places

function interiorPlace(kind: 'hub' | 'dock' | 'garden', opts: PlaceOpts): PlaceLayers {
  const pal = wallPal(opts.time, opts.lights);
  let room = moduleInterior(pal, opts, kind === 'garden' ? 5 : kind === 'dock' ? 4 : 3);
  room += backWallFrame(pal);
  if (kind === 'hub') room += hatchSvg(118, opts, pal, true, opts.props.has('cupola-glow'));
  if (kind === 'dock') room += hatchSvg(160, opts, pal, opts.props.has('hatch-open'), false) + (opts.props.has('hatch-open') ? cargoInside() : '');
  if (kind === 'garden') room += gardenChamber(opts, pal);
  return { back: rect(-1300, -100, 2600, 1200, 0, '#1b1f45'), room, twinkles: [], wash: washFor(opts) };
}

function cargoInside(): string {
  let s = '';
  const r = rng(9);
  for (let i = 0; i < 7; i++) {
    const x = -110 + (i % 4) * 62 + r() * 10, y = 360 + Math.floor(i / 4) * 70 + r() * 10;
    s += rect(x, y, 56, 46, 10, i % 3 ? '#f4f1ea' : '#e6dcc8', `stroke="#c9bfa9" stroke-width="3" transform="rotate(${f((r() - 0.5) * 20)} ${f(x + 28)} ${f(y + 23)})"`);
  }
  return s;
}

function washFor(opts: PlaceOpts): PlaceLayers['wash'] {
  if (opts.lights === 'off') return { color: '#0b0f2a', opacity: 0.22 };
  if (opts.lights === 'bedtime-dim') return { color: '#3a2a4a', opacity: 0.32 };
  if (opts.lights === 'bedtime' || opts.bedtime) return { color: '#4a3048', opacity: 0.2 };
  if (opts.time === 'night') return { color: '#0d1235', opacity: 0.12 };
  if (opts.lights === 'yellow') return { color: '#ffd75e', opacity: 0.1 };
  if (opts.lights === 'blue') return { color: '#62b6ff', opacity: 0.1 };
  return undefined;
}

function orbitPlace(opts: PlaceOpts): PlaceLayers {
  const time = (opts.time as EarthTime) || 'day';
  const sp = spaceSvg(opts.W, { warm: time === 'sunset' || time === 'sunrise', seed: 3 });
  let back = sp.svg;
  if (time === 'day') back += sunSvg(-Math.min(opts.W / 2, 640) * 0.7, 150, 46);
  if (time === 'sunset' || time === 'sunrise') back += sunSvg(Math.min(opts.W / 2, 640) * 0.55, 720, 40);
  back += earthSvg(0, 2080, 1380, time === 'sunrise' ? 'sunrise' : time === 'sunset' ? 'sunset' : time === 'night' ? 'night' : 'day', { seed: 21 });
  return { back, room: '', twinkles: sp.twinkles };
}

function cupolaPlace(opts: PlaceOpts): PlaceLayers {
  const time = (opts.time as EarthTime) || 'day';
  const sp = spaceSvg(opts.W, { seed: 9, warm: time === 'sunrise' });
  let back = sp.svg;
  const earthTime: EarthTime = time === 'night' ? 'night' : time === 'sunrise' ? 'sunrise' : 'day';
  back += earthSvg(140, 1520, 1180, earthTime, { seed: 33, aurora: opts.props.has('aurora') });
  if (time === 'sunrise') back += sunSvg(-260, 330, 34);
  back += moonSvg(-250, 200, 62, opts.moon);
  // the cupola: a round window in the middle, six trapezoids around it
  const cx = 0, cy = 400, rc = 175, rIn = 215, rOut = 470;
  const hex = (R: number, i: number): [number, number] => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3 + Math.PI / 6;
    return [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
  };
  const inset = (pts: [number, number][], d: number): [number, number][] => {
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return pts.map(([x, y]) => { const dx = x - mx, dy = y - my, L = Math.hypot(dx, dy); return [x - (dx / L) * d, y - (dy / L) * d]; });
  };
  const holes: string[] = [];
  holes.push(`M${cx - rc} ${cy} a${rc} ${rc} 0 1 0 ${rc * 2} 0 a${rc} ${rc} 0 1 0 ${-rc * 2} 0Z`);
  const wins: [number, number][][] = [];
  for (let i = 0; i < 6; i++) {
    const q = inset([hex(rIn, i), hex(rIn, i + 1), hex(rOut, i + 1), hex(rOut, i)], 26);
    wins.push(q);
    holes.push('M' + q.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + 'Z');
  }
  const night = time === 'night';
  const wall = night ? '#4a5182' : '#dfe3ea';
  const wall2 = night ? '#3c4372' : '#cfd5df';
  let room = path(`M-1300 -100 H1300 V1200 H-1300Z ${holes.join(' ')}`, wall, 'fill-rule="evenodd"');
  // radiating panels outside the ring
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    room += line(cx + Math.cos(a) * (rOut + 40), cy + Math.sin(a) * (rOut + 40), cx + Math.cos(a) * 1500, cy + Math.sin(a) * 1500, wall2, 10);
  }
  room += circle(cx, cy, rOut + 30, 'none', `stroke="${wall2}" stroke-width="22"`);
  // frames
  const frame = night ? '#8a93c4' : C.metal;
  const frameD = night ? '#6b73a6' : C.metalDark;
  room += circle(cx, cy, rc, 'none', `stroke="${frame}" stroke-width="20"`) + circle(cx, cy, rc + 10, 'none', `stroke="${frameD}" stroke-width="3"`);
  for (const q of wins) room += poly(q, 'none', `stroke="${frame}" stroke-width="16" stroke-linejoin="round"`);
  // handholds around the ring
  for (let i = 0; i < 6; i++) {
    const [x, y] = hex(rOut + 55, i + 0.5);
    room += line(x - 26, y, x + 26, y, C.railDark, 16) + line(x - 26, y, x + 26, y, C.rail, 11);
  }
  // reflections on glass
  room += path(`M${cx - rc * 0.6} ${cy - rc * 0.5} q${rc * 0.3} ${-rc * 0.3} ${rc * 0.6} ${-rc * 0.25}`, 'none', `stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.18"`);
  return { back, room, twinkles: sp.twinkles.filter((t) => t.y < 560), wash: night ? { color: '#0d1235', opacity: 0.1 } : undefined };
}

export const SLEEP_WINDOW = { fx: 0.5, y: 260, r: 120 };

function sleepPlace(opts: PlaceOpts): PlaceLayers {
  const half = Math.min(opts.W / 2, 680);
  const wx = SLEEP_WINDOW.fx * half, wy = SLEEP_WINDOW.y, wr = SLEEP_WINDOW.r;
  const sp = spaceSvg(opts.W, { seed: 15, top: 0, bottom: 520 });
  let back = sp.svg + earthSvg(wx + 60, wy + 560, 470, 'night', { seed: 41, aurora: opts.props.has('aurora') });
  const dim = opts.lights === 'off';
  const wall = dim ? '#3b3560' : '#5d5688';
  const wall2 = dim ? '#332e55' : '#4f4979';
  let room = path(`M-1300 -100 H1300 V1200 H-1300Z M${f(wx - wr)} ${wy} a${wr} ${wr} 0 1 0 ${wr * 2} 0 a${wr} ${wr} 0 1 0 ${-wr * 2} 0Z`, wall, 'fill-rule="evenodd"');
  // quilted padding
  for (let x = -1300; x < 1300; x += 120) room += line(x, -100, x, 1200, wall2, 4);
  for (let y = 40; y < 1000; y += 160) room += line(-1300, y, 1300, y, wall2, 3);
  room += circle(wx, wy, wr + 14, 'none', `stroke="${C.metal}" stroke-width="22"`) + circle(wx, wy, wr + 26, 'none', `stroke="${C.metalDark}" stroke-width="4"`);
  // a small reading lamp with a warm glow
  const lx = -0.9 * half + 60;
  if (!dim) room += circle(lx, 170, 140, C.nightLamp, 'opacity="0.10"') + circle(lx, 170, 70, C.nightLamp, 'opacity="0.14"');
  room += rect(lx - 26, 150, 52, 30, 12, dim ? '#6b6390' : C.nightLamp) + line(lx, 180, lx, 230, C.metalDark, 6);
  // floor strip with handrail
  room += rect(-1300, 900, 2600, 200, 0, wall2) + line(-half, 910, half, 910, C.rail, 12);
  return { back, room, twinkles: sp.twinkles.filter((t) => Math.hypot(t.x - wx, t.y - wy) < wr - 10), wash: dim ? { color: '#0b0f2a', opacity: 0.35 } : { color: '#3a2a4a', opacity: 0.12 } };
}

function tunnelPlace(opts: PlaceOpts): PlaceLayers {
  let room = rect(-1300, -100, 2600, 1200, 0, '#1d2148');
  for (let i = 7; i >= 0; i--) {
    const s = 0.55 + i * 0.42;
    const w = 300 * s, h = 230 * s;
    room += rect(-w, 430 - h, w * 2, h * 2, 60 * s, i % 2 ? '#2b3164' : '#252a59', `stroke="#3a4280" stroke-width="${f(5 * s)}"`);
  }
  room += circle(0, 430, 90, '#3b4fa0', 'opacity="0.35"') + circle(0, 430, 40, '#9fb6ff', 'opacity="0.25"');
  void opts;
  return { back: '', room, twinkles: [], wash: { color: '#0d1235', opacity: 0.1 } };
}

export function placeLayers(place: string, opts: PlaceOpts): PlaceLayers {
  switch (place) {
    case 'orbit': return orbitPlace(opts);
    case 'cupola': return cupolaPlace(opts);
    case 'sleep': return sleepPlace(opts);
    case 'tunnel': return tunnelPlace(opts);
    case 'dock': return interiorPlace('dock', opts);
    case 'garden': return interiorPlace('garden', opts);
    default: return interiorPlace('hub', opts);
  }
}

export { VP, BACK };
