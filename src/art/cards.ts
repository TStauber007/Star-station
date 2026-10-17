// Picture cards for choices. Each is a small scene, 400 x 300.
import { C, shade } from './palette.ts';
import { circle, ellipse, f, line, path, rect, sparklePath, starPath, svgDoc } from './svg.ts';
import { kidInBagSvg, kidSvg, type Avatar, type Who } from './crew.ts';
import { robotSvg } from './robot.ts';
import { placeSvg } from './flat.ts';
import { blanketSvg, plantsSvg, stationSvg } from './props.ts';
import { earthSvg, moonSvg, sunSvg } from './sky.ts';

export interface CardCtx {
  avatars: Record<Who, Avatar>;
  crew: 'two' | 'solo';
  soloWho: Who;
}

const put = (svg: string, x: number, y: number, w: number, h: number, extra = '') =>
  `<g ${extra}>${placeSvg(svg, x - w / 2, y - h / 2, w, h)}</g>`;

const bg = (c1: string, c2: string) =>
  `<defs><linearGradient id="cb${c1.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>` +
  rect(0, 0, 400, 300, 0, `url(#cb${c1.slice(1)})`);

function kids(ctx: CardCtx, pose: string, opts: { x?: number; y?: number; gap?: number; size?: number; flipT?: boolean } = {}): string {
  const size = opts.size ?? 1;
  const x = opts.x ?? 200, y = opts.y ?? 170;
  if (ctx.crew === 'solo') return put(kidSvg(ctx.soloWho, ctx.avatars[ctx.soloWho], pose), x, y, 150 * size, 210 * size);
  const gap = (opts.gap ?? 70) * size;
  return put(kidSvg('A', ctx.avatars.A, pose), x - gap, y - 6 * size, 150 * size, 210 * size) +
    put(kidSvg('T', ctx.avatars.T, pose), x + gap, y + 14 * size, 128 * size, 180 * size, opts.flipT ? `transform="translate(${f(2 * (x + gap))} 0) scale(-1 1)"` : '');
}

const tKid = (ctx: CardCtx) => (ctx.crew === 'solo' ? ctx.soloWho : 'T');
const bot = (mood: string, x: number, y: number, s = 1) => put(robotSvg(mood), x, y, 130 * s, 150 * s);
const sparkles = (pts: [number, number, number][], col: string = C.white) => pts.map(([x, y, r]) => path(sparklePath(x, y, r), col, 'opacity="0.9"')).join('');
const heart = (x: number, y: number, s: number, col = C.rose) =>
  path(`M${x} ${y + 10 * s} C${x - 26 * s} ${y - 8 * s} ${x - 12 * s} ${y - 28 * s} ${x} ${y - 14 * s} C${x + 12 * s} ${y - 28 * s} ${x + 26 * s} ${y - 8 * s} ${x} ${y + 10 * s}Z`, col);

const window = (cx: number, cy: number, r: number, inner: string) =>
  `<defs><clipPath id="cw${cx}${cy}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>` +
  circle(cx, cy, r, C.space1) + `<g clip-path="url(#cw${cx}${cy})">${inner}</g>` + circle(cx, cy, r + 8, 'none', `stroke="${C.metal}" stroke-width="16"`);

const sunCatcher = (x: number, y: number, s: number, rot: number, on: boolean) =>
  `<g transform="translate(${x} ${y}) scale(${s}) rotate(${rot})">` +
  rect(-8, 30, 16, 60, 6, C.metalDark) + rect(-60, -40, 120, 80, 8, '#3e5fae', `stroke="#c4a454" stroke-width="6"`) +
  line(-20, -36, -20, 36, '#7f9be0', 3) + line(20, -36, 20, 36, '#7f9be0', 3) + line(-56, 0, 56, 0, '#7f9be0', 3) +
  circle(34, 80, 8, on ? '#5ee07a' : '#4a5a50') + '</g>';

const bulbs = (col: string) => {
  let s = path('M20 70 Q200 140 380 70', 'none', `stroke="${C.cable}" stroke-width="5"`);
  for (let i = 0; i < 7; i++) {
    const t = (i + 0.5) / 7;
    const x = 20 + t * 360, y = 70 + Math.sin(t * Math.PI) * 52;
    s += circle(x, y + 22, 30, col, 'opacity="0.25"') + line(x, y, x, y + 10, C.cable, 4) + ellipse(x, y + 24, 16, 20, col);
  }
  return s;
};

const telescope = (x: number, y: number, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">` +
  rect(-8, 0, 16, 60, 6, C.metalDark) + `<g transform="rotate(-24)">` + rect(-90, -22, 170, 44, 20, '#f4f1ea', `stroke="${C.metalDark}" stroke-width="5"`) + rect(64, -28, 24, 56, 8, C.coral) + circle(86, 0, 18, '#9fc6ff') + '</g></g>';

export const CARDS = [
  'wave', 'song', 'zoom', 'show-way', 'color-yellow', 'color-blue',
  'lettuce', 'zinnia', 'dig', 'rest', 'draw', 'sing-plants',
  'somersault', 'ball', 'tell', 'hide', 'face-window', 'face-wall',
  'turns', 'squeeze', 'first-crew', 'first-button', 'keep-looking', 'button-turn',
  'hold-hand', 'flashlight', 'bag', 'table', 'go-together', 'blanket',
  'pajamas', 'toothbrush', 'right-side-up', 'upside-down', 'thanks-earth', 'thanks-button',
] as const;

export function cardSvg(id: string, ctx: CardCtx): string {
  const inside = bg('#fbf4e4', '#f1e4c8');
  const night = bg('#2b3270', '#4a3f80');
  const T = tKid(ctx);
  let s: string;
  switch (id) {
    case 'wave': s = inside + kids(ctx, 'wave', { x: 160 }) + bot('peek', 330, 170, 0.9); break;
    case 'song': s = inside + kids(ctx, 'sing', { x: 175 }) + put(svgDoc('0 0 200 160', [[40, 90, C.lavender], [110, 50, C.coral], [160, 100, C.teal]].map(([x, y, c]) => ellipse(x as number, y as number, 14, 10, c as string) + line((x as number) + 12, y as number, (x as number) + 12, (y as number) - 46, c as string, 5)).join('')), 330, 90, 150, 120); break;
    case 'zoom': s = inside + window(330, 120, 60, earthSvg(330, 260, 120, 'day', { seed: 3 })) + `<g transform="rotate(-8 170 170)">` + kids(ctx, 'zoom', { x: 160, gap: 60 }) + '</g>'; break;
    case 'show-way': s = inside + (ctx.crew === 'two'
      ? put(kidSvg('A', ctx.avatars.A, 'hold'), 95, 165, 150, 210) + bot('happy', 205, 175, 0.9) + put(kidSvg('T', ctx.avatars.T, 'hold'), 315, 180, 128, 180, 'transform="translate(630 0) scale(-1 1)"')
      : put(kidSvg(ctx.soloWho, ctx.avatars[ctx.soloWho], 'hold'), 130, 165, 150, 210) + bot('happy', 260, 175, 0.9)) + heart(205, 70, 1.2); break;
    case 'color-yellow': s = bg('#4a4f7a', '#6a5f8a') + bulbs(C.partyYellow) + rect(0, 0, 400, 300, 0, C.partyYellow, 'opacity="0.12"'); break;
    case 'color-blue': s = bg('#4a4f7a', '#6a5f8a') + bulbs(C.partyBlue) + rect(0, 0, 400, 300, 0, C.partyBlue, 'opacity="0.12"'); break;
    case 'lettuce': s = bg('#f8d0ef', '#c9a6f2') + put(plantsSvg('lettuce', 3).replace('viewBox="0 0 460 360"', 'viewBox="135 150 190 180"'), 200, 155, 300, 284); break;
    case 'zinnia': s = bg('#f8d0ef', '#c9a6f2') + put(plantsSvg('zinnia', 3).replace('viewBox="0 0 460 360"', 'viewBox="160 90 140 230"'), 200, 150, 170, 280); break;
    case 'dig': s = bg('#f8d0ef', '#c9a6f2') + ellipse(200, 230, 110, 60, C.pillowShade) + ellipse(200, 222, 104, 54, C.pillow) +
      ellipse(200, 150, 26, 18, '#9a6b3c') + path('M200 166 q-8 26 6 52', 'none', 'stroke="#d9c39a" stroke-width="5" stroke-linecap="round"') +
      put(kidSvg(T, ctx.avatars[T], 'look'), 320, 140, 110, 160) + sparkles([[150, 120, 12], [250, 110, 10]], C.sunflower); break;
    case 'rest': s = bg('#5a4f8a', '#8a72c4') + [-1, 0, 1].map((i) => ellipse(200 + i * 110, 225, 52, 36, C.pillowShade) + ellipse(200 + i * 110, 219, 50, 32, C.pillow) + path(`M${180 + i * 110} 205 q20 -10 40 0`, 'none', `stroke="${C.pillowShade}" stroke-width="3"`)).join('') +
      moonSvg(310, 80, 36, 'crescent') + `<text x="120" y="110" font-size="44" font-family="sans-serif" fill="${C.white}" opacity="0.85">z z z</text>`; break;
    case 'draw': s = inside + rect(70, 50, 260, 200, 12, '#fffdf6', `stroke="#e2d6bf" stroke-width="5" transform="rotate(-4 200 150)"`) + circle(270, 110, 30, C.sunflower) +
      path('M130 230 q-10 -60 10 -100 M160 230 q0 -50 24 -80 M190 230 q10 -40 34 -50', 'none', `stroke="${C.leaf0}" stroke-width="10" stroke-linecap="round" fill="none"`) +
      [C.coral, C.sky, C.mint].map((c, i) => `<g transform="rotate(${-30 + i * 12} ${310 + i * 18} 230)">` + rect(300 + i * 18, 190, 14, 80, 4, c) + path(`M${300 + i * 18} 190 l7 -16 l7 16z`, shade(c, -0.2)) + '</g>').join(''); break;
    case 'sing-plants': s = bg('#f8d0ef', '#c9a6f2') + put(plantsSvg('lettuce', 1), 200, 200, 330, 260) + put(svgDoc('0 0 200 160', [[40, 90, C.lavender], [110, 50, C.coral], [160, 100, C.teal]].map(([x, y, c]) => ellipse(x as number, y as number, 14, 10, c as string) + line((x as number) + 12, y as number, (x as number) + 12, (y as number) - 46, c as string, 5)).join('')), 200, 80, 220, 150); break;
    case 'somersault': s = inside + path('M120 150 a80 80 0 1 1 160 0', 'none', `stroke="${C.sky}" stroke-width="8" stroke-dasharray="14 12" stroke-linecap="round"`) +
      put(kidSvg('A', ctx.avatars[ctx.crew === 'solo' ? ctx.soloWho : 'A'], 'tumble'), 200, 160, 150, 210, 'transform="rotate(140 200 160)"'); break;
    case 'ball': s = inside + path('M60 240 L130 90 L200 230 L270 100 L320 180', 'none', `stroke="${C.coral}" stroke-width="6" stroke-dasharray="12 10" stroke-linecap="round" fill="none"`) +
      circle(320, 180, 40, C.coral) + path('M284 180 q36 -26 72 0', 'none', `stroke="${C.sunflower}" stroke-width="9"`); break;
    case 'tell': {
      const who: Who = ctx.crew === 'solo' ? ctx.soloWho : 'A';
      s = inside + put(kidSvg(who, ctx.avatars[who], 'float'), 120, 170, 150, 210) + bot('happy', 300, 180, 1) +
        path('M170 70 h120 a20 20 0 0 1 20 20 v40 a20 20 0 0 1 -20 20 h-90 l-24 22 l4 -22 h-10 a20 20 0 0 1 -20 -20 v-40 a20 20 0 0 1 20 -20z', C.white, `stroke="#e2d6bf" stroke-width="3"`) +
        sunCatcher(230, 108, 0.32, -18, false);
      break;
    }
    case 'hide': s = inside + sunCatcher(150, 150, 0.9, -18, false) + rect(150, 30, 220, 20, 8, C.metalDark) + path('M160 48 q16 120 0 230 h200 q-16 -120 0 -230z', '#a98bd8') +
      [200, 250, 300].map((x) => path(`M${x} 52 q12 110 0 220`, 'none', 'stroke="#8f72c4" stroke-width="6"')).join(''); break;
    case 'face-window': s = inside + window(110, 120, 80, sunSvg(110, 110, 30)) + sunCatcher(270, 140, 0.95, -15, true) + path('M180 110 L220 125', 'none', `stroke="${C.sunflower}" stroke-width="6" stroke-dasharray="8 8"`); break;
    case 'face-wall': s = inside + rect(250, 30, 140, 240, 10, '#e9dfc9', `stroke="${C.panelLine}" stroke-width="4"`) + rect(280, 70, 60, 60, 8, C.velcro) +
      put(svgDoc('0 0 120 120', path('M40 14 h34 v48 q0 10 8 16 l18 14 q10 9 0 18 q-8 6 -18 0 l-30 -20 q-12 -8 -12 -22z', C.white, 'stroke="#d7d0c2" stroke-width="3"') + rect(40, 14, 34, 12, 4, C.coral)), 312, 100, 80, 80) +
      sunCatcher(140, 150, 0.95, 15, false); break;
    case 'turns': s = night + moonSvg(330, 70, 36, 'crescent') + telescope(80, 150, 0.7) +
      (ctx.crew === 'two' ? put(kidSvg('A', ctx.avatars.A, 'float'), 170, 190, 105, 150) + put(kidSvg('T', ctx.avatars.T, 'float'), 250, 200, 90, 130) + bot('happy', 330, 205, 0.7)
        : put(kidSvg(ctx.soloWho, ctx.avatars[ctx.soloWho], 'float'), 200, 190, 105, 150) + bot('happy', 300, 205, 0.7)) +
      [[170, 100], [250, 120], [330, 140]].slice(0, ctx.crew === 'two' ? 3 : 2).map(([x, y], i) => circle(ctx.crew === 'two' ? x : x + 30 * i, y - 4, 18, C.sunflower) + `<text x="${ctx.crew === 'two' ? x : x + 30 * i}" y="${y + 4}" font-size="22" font-family="sans-serif" text-anchor="middle" fill="${C.ink}" font-weight="bold">${i + 1}</text>`).join(''); break;
    case 'squeeze': s = night + moonSvg(330, 60, 30, 'crescent') + telescope(110, 160, 0.8) +
      (ctx.crew === 'two' ? put(kidSvg('A', ctx.avatars.A, 'squish'), 220, 170, 130, 180, 'transform="rotate(14 220 170)"') + put(kidSvg('T', ctx.avatars.T, 'squish'), 270, 190, 110, 160, 'transform="rotate(-12 270 190)"')
        : put(kidSvg(ctx.soloWho, ctx.avatars[ctx.soloWho], 'squish'), 230, 175, 130, 180, 'transform="rotate(12 230 175)"')) + bot('squish', 320, 160, 0.75) +
      sparkles([[190, 70, 14], [300, 80, 12]], C.sunflower); break;
    case 'first-crew': s = night + moonSvg(320, 70, 34, 'crescent') + telescope(150, 160, 0.9) + put(kidSvg(T, ctx.avatars[T], 'telescope'), 290, 180, 140, 200); break;
    case 'first-button': s = night + moonSvg(320, 70, 34, 'crescent') + telescope(150, 160, 0.9) + bot('telescope', 290, 180, 1.05); break;
    case 'keep-looking': s = night + moonSvg(320, 70, 40, 'full') + telescope(150, 160, 0.9) + put(kidSvg(T, ctx.avatars[T], 'telescope'), 290, 180, 140, 200); break;
    case 'button-turn': s = night + moonSvg(320, 70, 40, 'full') + telescope(130, 160, 0.9) + bot('telescope', 250, 180, 1) + put(kidSvg(T, ctx.avatars[T], 'wave'), 345, 190, 110, 160); break;
    case 'hold-hand': s = night + bot('scared', 270, 170, 1.2) + put(kidSvg(ctx.crew === 'solo' ? ctx.soloWho : 'A', ctx.avatars[ctx.crew === 'solo' ? ctx.soloWho : 'A'], 'hold'), 120, 165, 150, 210) + heart(200, 70, 1.1); break;
    case 'flashlight': s = night + path('M150 170 L380 60 L380 290Z', '#fff3c2', 'opacity="0.35"') + `<g transform="rotate(-10 120 170)">` + rect(40, 145, 120, 50, 16, C.coral) + rect(150, 135, 30, 70, 10, C.metal) + circle(60, 170, 8, C.sunflower) + '</g>'; break;
    case 'bag': s = bg('#3a4170', '#4a4f7a') + put(svgDoc('0 0 240 210', rect(10, 20, 220, 180, 40, C.bagBlue) + rect(30, 40, 180, 30, 14, shade(C.bagBlue, 0.25)) + rect(100, 6, 40, 30, 10, shade(C.bagBlue, -0.2))), 200, 160, 260, 230) + sparkles([[330, 70, 16]], C.sunflower); break;
    case 'table': s = bg('#3a4170', '#4a4f7a') + put(svgDoc('0 0 280 220', rect(10, 30, 260, 34, 12, '#c9b998') + rect(20, 24, 240, 12, 6, '#ddd0b4') + rect(40, 60, 18, 150, 8, C.metalDark) + rect(222, 60, 18, 150, 8, C.metalDark)), 200, 170, 300, 236) + sparkles([[90, 70, 16]], C.sunflower); break;
    case 'go-together': s = bg('#1d2148', '#2b3164') + rect(260, 60, 130, 190, 50, '#151935', `stroke="#3a4280" stroke-width="6"`) + path('M200 160 L380 110 L380 220Z', '#fff3c2', 'opacity="0.25"') +
      (ctx.crew === 'two' ? put(kidSvg('A', ctx.avatars.A, 'hold'), 70, 165, 120, 170) + bot('brave', 160, 175, 0.8) + put(kidSvg('T', ctx.avatars.T, 'hold'), 240, 185, 100, 140, 'transform="translate(480 0) scale(-1 1)"')
        : put(kidSvg(ctx.soloWho, ctx.avatars[ctx.soloWho], 'hold'), 100, 165, 130, 180) + bot('brave', 210, 175, 0.85)); break;
    case 'blanket': s = bg('#3a4170', '#4a4f7a') + put(blanketSvg(ctx.crew === 'two' ? 3 : 2), 200, 170, 360, 210); break;
    case 'pajamas': s = bg('#4a3f78', '#6a5a9a') + put(kidSvg(T, ctx.avatars[T], 'pajamas'), 200, 160, 160, 224) + sparkles([[90, 70, 12], [320, 90, 14]], C.sunflower); break;
    case 'toothbrush': s = bg('#4a3f78', '#6a5a9a') + `<g transform="rotate(-25 200 150)">` + rect(80, 140, 230, 24, 12, C.sky) + rect(260, 110, 60, 34, 8, C.white) +
      [0, 1, 2, 3, 4].map((i) => rect(266 + i * 11, 96, 6, 18, 3, '#d9eefc')).join('') + path('M262 92 q30 -30 60 0', '#9fe0ff') + '</g>' + sparkles([[110, 80, 14], [300, 230, 12]], C.white); break;
    case 'right-side-up': s = bg('#3b3560', '#5d5688') + put(kidInBagSvg(T, ctx.avatars[T]), 200, 160, 160, 224) + path(`M330 230 v-120 m-18 18 l18 -18 l18 18`, 'none', `stroke="${C.sunflower}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"`); break;
    case 'upside-down': s = bg('#3b3560', '#5d5688') + put(kidInBagSvg(T, ctx.avatars[T], { upside: true }), 200, 150, 160, 224) + path(`M330 90 v120 m-18 -18 l18 18 l18 -18`, 'none', `stroke="${C.sunflower}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"`); break;
    case 'thanks-earth': s = bg('#1e2452', '#33397a') + earthSvg(200, 170, 100, 'day', { seed: 8 }) + heart(300, 70, 1.3) + sparkles([[80, 60, 12], [340, 230, 10]], C.star); break;
    case 'thanks-button': s = bg('#3b3560', '#5d5688') + bot('glow', 200, 170, 1.4) + heart(310, 70, 1.3) + sparkles([[80, 70, 12]], C.star); break;
    default: s = inside + path(starPath(200, 150, 80), C.sunflower);
  }
  return svgDoc('0 0 400 300', s);
}

/** Small mission cover thumbnails reuse the station exterior. */
export const stationThumb = () => stationSvg('on');
