// Space, the Sun, the Earth and the Moon.
import { C, shade } from './palette.ts';
import { circle, ellipse, f, path, rect, rng } from './svg.ts';

export interface Twinkle { x: number; y: number; r: number; d: number }

/** Deep space with fixed small stars. Returns svg + a few twinkling stars. */
export function spaceSvg(W: number, opts: { warm?: boolean; seed?: number; top?: number; bottom?: number } = {}) {
  const id = `sp${opts.seed ?? 1}${opts.warm ? 'w' : ''}`;
  const top = opts.top ?? 0, bottom = opts.bottom ?? 1000;
  const grad = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.space0}"/><stop offset="0.65" stop-color="${C.space1}"/>
    <stop offset="1" stop-color="${opts.warm ? '#5a3f78' : C.space2}"/></linearGradient>`;
  let s = `<defs>${grad}</defs>` + rect(-1300, top - 50, 2600, bottom - top + 100, 0, `url(#${id})`);
  const r = rng(opts.seed ?? 7);
  const span = Math.max(W, 1400);
  for (let i = 0; i < 110; i++) {
    const x = (r() - 0.5) * span * 1.1, y = top + r() * (bottom - top);
    const rr = 0.8 + r() * 2.2;
    s += circle(x, y, rr, C.star, `opacity="${f(0.35 + r() * 0.6)}"`);
  }
  const twinkles: Twinkle[] = [];
  for (let i = 0; i < 14; i++) twinkles.push({ x: (r() - 0.5) * Math.min(W, 1600) * 0.95, y: top + 20 + r() * (bottom - top) * 0.8, r: 5 + r() * 6, d: r() * 4 });
  return { svg: s, twinkles };
}

export function sunSvg(cx: number, cy: number, r: number): string {
  return circle(cx, cy, r * 3.2, C.sunGlow, 'opacity="0.10"') + circle(cx, cy, r * 2.1, C.sunGlow, 'opacity="0.18"') +
    circle(cx, cy, r * 1.4, C.sun, 'opacity="0.45"') + circle(cx, cy, r, '#fffbe8');
}

function blob(cx: number, cy: number, rad: number, seed: number, n = 9): string {
  const r = rng(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = rad * (0.62 + r() * 0.55);
    pts.push([cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr * 0.8]);
  }
  // smooth closed curve through midpoints
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    d += i === 0 ? `M${f(m[0])} ${f(m[1])} ` : `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])} `;
  }
  const p0 = pts[0], m0 = [(pts[n - 1][0] + p0[0]) / 2, (pts[n - 1][1] + p0[1]) / 2];
  d += `Q${f(pts[0][0])} ${f(pts[0][1])} ${f((pts[0][0] + pts[1][0]) / 2)} ${f((pts[0][1] + pts[1][1]) / 2)} Z`;
  void m0;
  return d;
}

export type EarthTime = 'day' | 'night' | 'sunrise' | 'sunset';

/** A big Earth disk. Continents and clouds are simple soft shapes. */
export function earthSvg(cx: number, cy: number, R: number, time: EarthTime, opts: { aurora?: boolean; cities?: boolean; seed?: number } = {}): string {
  const id = `e${Math.round(cx)}_${Math.round(cy)}_${Math.round(R)}_${time}_${opts.seed ?? 11}`;
  const night = time === 'night';
  const ocean = night ? C.nightOcean : C.ocean0;
  const defs = `<defs>
    <radialGradient id="${id}g" cx="0.42" cy="0.18" r="0.75">
      <stop offset="0" stop-color="${night ? '#24346a' : C.ocean2}"/>
      <stop offset="0.55" stop-color="${night ? C.nightOcean : C.ocean1}"/>
      <stop offset="1" stop-color="${night ? '#0f1838' : ocean}"/>
    </radialGradient>
    <clipPath id="${id}c"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}"/></clipPath>
  </defs>`;
  let s = defs;
  // atmosphere glow
  const atm = time === 'sunrise' || time === 'sunset' ? C.duskGold : C.atmos;
  s += circle(cx, cy, R + 34, atm, `opacity="${night ? 0.12 : 0.22}"`) + circle(cx, cy, R + 14, atm, `opacity="${night ? 0.18 : 0.4}"`);
  s += circle(cx, cy, R, `url(#${id}g)`);
  let inner = '';
  const r = rng(opts.seed ?? 11);
  const land = night ? C.nightLand : C.land0;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 1.9;
    const dist = R * (0.18 + r() * 0.75);
    const bx = cx + Math.cos(a) * dist, by = cy + Math.sin(a) * dist;
    const size = R * (0.08 + r() * 0.14);
    inner += path(blob(bx, by, size, 100 + i), i % 3 === 0 && !night ? C.sand : land);
    if (!night) inner += path(blob(bx - size * 0.15, by - size * 0.1, size * 0.55, 200 + i), C.land1, 'opacity="0.7"');
    if (night && opts.cities !== false) {
      for (let k = 0; k < 9; k++) {
        const ccx = bx + (r() - 0.5) * size * 1.6, ccy = by + (r() - 0.5) * size * 0.9;
        inner += circle(ccx, ccy, 2 + r() * 3.5, k % 3 ? C.city : C.cityWhite, `opacity="${f(0.55 + r() * 0.45)}"`);
        inner += circle(ccx, ccy, 9, C.city, 'opacity="0.12"');
      }
    }
  }
  if (!night) {
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 2.1;
      const dist = R * (0.1 + r() * 0.85);
      const x = cx + Math.cos(a) * dist, y = cy + Math.sin(a) * dist;
      const w = R * (0.06 + r() * 0.12);
      inner += ellipse(x, y, w, w * 0.32, C.cloud, `opacity="${f(0.55 + r() * 0.35)}" transform="rotate(${f((r() - 0.5) * 30)} ${f(x)} ${f(y)})"`);
      inner += path(`M${f(x - w * 0.8)} ${f(y + w * 0.35)} q${f(w * 0.5)} ${f(-w * 0.35)} ${f(w * 1.2)} ${f(-w * 0.1)}`, 'none', `stroke="${C.cloud}" stroke-width="${f(w * 0.12)}" stroke-linecap="round" opacity="0.6"`);
    }
  }
  if (time === 'sunrise' || time === 'sunset') {
    inner += circle(cx, cy, R, 'none', `stroke="${C.dusk}" stroke-width="40" opacity="0.55"`);
    inner += circle(cx, cy, R, 'none', `stroke="${C.duskGold}" stroke-width="16" opacity="0.8"`);
  }
  s += `<g clip-path="url(#${id}c)">${inner}</g>`;
  if (night) s += circle(cx, cy, R, 'none', `stroke="${C.atmos}" stroke-width="5" opacity="0.35"`);
  if (opts.aurora) s += auroraSvg(cx, cy, R);
  return s;
}

export function auroraSvg(cx: number, cy: number, R: number): string {
  let s = '';
  for (let i = 0; i < 4; i++) {
    const y0 = cy - R + 18 + i * 9;
    const x0 = cx - R * 0.42 + i * 16;
    const w = R * 0.62;
    s += path(`M${f(x0)} ${f(y0)} q${f(w * 0.25)} ${f(-60 - i * 6)} ${f(w * 0.5)} ${f(-8)} t${f(w * 0.5)} ${f(4)}`, 'none',
      `stroke="${i % 2 ? C.aurora2 : C.aurora}" stroke-width="${16 - i * 3}" stroke-linecap="round" opacity="${f(0.55 - i * 0.08)}"`);
  }
  return `<g class="aurora">${s}</g>`;
}

export type MoonPhase = 'none' | 'crescent' | 'half' | 'gibbous' | 'full';
const PHASE_FRACTION: Record<MoonPhase, number> = { none: 0, crescent: 0.22, half: 0.5, gibbous: 0.8, full: 1 };

/** The Moon, lit from the right (waxing) like the evening Moon. */
export function moonSvg(cx: number, cy: number, r: number, phase: MoonPhase): string {
  if (phase === 'none') return '';
  const k = PHASE_FRACTION[phase];
  const id = `mn${Math.round(cx)}${Math.round(cy)}${phase}`;
  let lit: string;
  if (k >= 1) lit = `M${f(cx)} ${f(cy - r)} A${f(r)} ${f(r)} 0 1 1 ${f(cx)} ${f(cy + r)} A${f(r)} ${f(r)} 0 1 1 ${f(cx)} ${f(cy - r)}Z`;
  else {
    const rx = Math.abs(1 - 2 * k) * r;
    const sweep = k < 0.5 ? 0 : 1;
    lit = `M${f(cx)} ${f(cy - r)} A${f(r)} ${f(r)} 0 0 1 ${f(cx)} ${f(cy + r)} A${f(rx)} ${f(r)} 0 0 ${sweep} ${f(cx)} ${f(cy - r)}Z`;
  }
  const maria = [
    ellipse(cx - r * 0.25, cy - r * 0.25, r * 0.22, r * 0.17, C.moonShade),
    ellipse(cx + r * 0.22, cy - r * 0.05, r * 0.17, r * 0.24, C.moonShade),
    ellipse(cx - r * 0.05, cy + r * 0.35, r * 0.26, r * 0.14, C.moonShade),
    circle(cx + r * 0.42, cy + r * 0.4, r * 0.08, C.moonShade),
  ].join('');
  return `<defs><clipPath id="${id}"><path d="${lit}"/></clipPath></defs>` +
    (k >= 0.5 ? circle(cx, cy, r * 1.5, C.moon, `opacity="${f(k * 0.1)}"`) : '') +
    circle(cx, cy, r, C.moonDark, 'opacity="0.3"') +
    path(lit, C.moon) + `<g clip-path="url(#${id})" opacity="0.8">${maria}</g>`;
}

/** A small Earth for cards and stickers. */
export function littleEarth(cx: number, cy: number, r: number): string {
  return earthSvg(cx, cy, r, 'day', { seed: 5 });
}

export const lighten = shade;
