// The crew: Abigail (the big one) and Tommy (the little one), drawn in code.
// Parents pick skin tone, hair style, hair colour and shirt colour. No photos.
import { C, HAIR, SHIRT, SKIN, SKIN_SHADE, shade } from './palette.ts';
import { circle, ellipse, f, g, path, rect, svgDoc } from './svg.ts';

export type Who = 'A' | 'T';

export interface Avatar {
  skin: number;
  hair: HairStyle;
  hairColor: number;
  shirt: number;
}

export const HAIR_STYLES = ['puffs', 'cloud', 'curls', 'bob', 'bun', 'tuft', 'short', 'swoop'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const DEFAULT_AVATARS: Record<Who, Avatar> = {
  A: { skin: 1, hair: 'puffs', hairColor: 2, shirt: 0 },
  T: { skin: 1, hair: 'tuft', hairColor: 4, shirt: 1 },
};

export const CREW_POSES = [
  'float', 'wave', 'sing', 'zoom', 'hold', 'look', 'cheer', 'worry', 'tumble', 'squish',
  'telescope', 'blanket', 'pajamas', 'bed', 'bed-up', 'bed-down', 'none',
] as const;

type Eyes = 'open' | 'happy' | 'closed' | 'up' | 'wide' | 'side';
type Mouth = 'smile' | 'grin' | 'o' | 'small' | 'worried' | 'sleepy';

interface Pose {
  armL: number; // degrees out from hanging straight down
  armR: number;
  legL: number;
  legR: number;
  bend: number; // knee bend
  eyes: Eyes;
  mouth: Mouth;
  brows?: boolean;
  waveR?: boolean;
  lines?: boolean; // speed lines
  pj?: boolean;
}

const POSES: Record<string, Pose> = {
  float: { armL: 42, armR: 38, legL: 16, legR: 22, bend: 18, eyes: 'open', mouth: 'smile' },
  wave: { armL: 30, armR: 150, legL: 14, legR: 20, bend: 14, eyes: 'happy', mouth: 'grin', waveR: true },
  sing: { armL: 60, armR: 60, legL: 18, legR: 18, bend: 14, eyes: 'happy', mouth: 'o' },
  zoom: { armL: 120, armR: 110, legL: -10, legR: 30, bend: 30, eyes: 'open', mouth: 'grin', lines: true },
  hold: { armL: 36, armR: 96, legL: 14, legR: 20, bend: 16, eyes: 'happy', mouth: 'smile' },
  look: { armL: 34, armR: 40, legL: 14, legR: 18, bend: 18, eyes: 'up', mouth: 'small' },
  cheer: { armL: 158, armR: 154, legL: 22, legR: 26, bend: 16, eyes: 'happy', mouth: 'grin' },
  worry: { armL: 16, armR: 18, legL: 8, legR: 10, bend: 22, eyes: 'open', mouth: 'worried', brows: true },
  tumble: { armL: 95, armR: 95, legL: 40, legR: 40, bend: 50, eyes: 'happy', mouth: 'grin' },
  squish: { armL: 80, armR: 130, legL: 30, legR: 5, bend: 30, eyes: 'closed', mouth: 'o' },
  telescope: { armL: 70, armR: 92, legL: 18, legR: 24, bend: 20, eyes: 'side', mouth: 'o' },
  pajamas: { armL: 36, armR: 40, legL: 14, legR: 18, bend: 16, eyes: 'open', mouth: 'smile', pj: true },
};

const BODY = {
  A: { headR: 64, headY: 120, torsoTop: 182, torsoH: 100, torsoW: 92, armLen: 82, armW: 23, legLen: 92, legW: 27, hip: 19 },
  T: { headR: 68, headY: 124, torsoTop: 190, torsoH: 82, torsoW: 92, armLen: 66, armW: 22, legLen: 66, legW: 26, hip: 18 },
};

/** How big each child is drawn on stage (design units for the 300x420 box). */
export const CREW_SCALE: Record<Who, number> = { A: 1, T: 0.86 };

const PANTS = '#4c5a8e';
const SOCK = '#ffffff';

const rad = (d: number) => (d * Math.PI) / 180;

function limb(x: number, y: number, angle: number, len: number, side: -1 | 1, bend: number) {
  // angle measured from straight down, outward on `side`
  const a = rad(angle) * side;
  const ex = x + Math.sin(a) * len;
  const ey = y + Math.cos(a) * len;
  // a gentle curve for a soft, rubbery picture-book limb
  const mx = (x + ex) / 2 + Math.cos(a) * bend * side * 0.35;
  const my = (y + ey) / 2 - Math.sin(Math.abs(a)) * bend * 0.15;
  return { ex, ey, d: `M${f(x)} ${f(y)} Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}` };
}

function eyesSvg(cx: number, cy: number, eyes: Eyes, scale = 1): string {
  const dx = 22 * scale;
  const ink = C.ink;
  const pair = (fn: (x: number) => string) => fn(cx - dx) + fn(cx + dx);
  switch (eyes) {
    case 'happy':
      return pair((x) => path(`M${f(x - 8)} ${f(cy + 3)} Q${f(x)} ${f(cy - 7)} ${f(x + 8)} ${f(cy + 3)}`, 'none', `stroke="${ink}" stroke-width="4.5" stroke-linecap="round"`));
    case 'closed':
      return pair((x) => path(`M${f(x - 8)} ${f(cy)} Q${f(x)} ${f(cy + 7)} ${f(x + 8)} ${f(cy)}`, 'none', `stroke="${ink}" stroke-width="4.5" stroke-linecap="round"`));
    case 'up':
      return pair((x) => ellipse(x + 1, cy - 4, 7, 8, ink) + circle(x + 3, cy - 7, 2.6, C.white));
    case 'side':
      return pair((x) => ellipse(x + 4, cy, 7, 8, ink) + circle(x + 6, cy - 3, 2.6, C.white));
    case 'wide':
      return pair((x) => ellipse(x, cy, 10, 11, C.white) + ellipse(x, cy + 1, 6.5, 7.5, ink) + circle(x + 2, cy - 2, 2.4, C.white));
    default:
      return `<g class="blink" style="transform-origin:${f(cx)}px ${f(cy)}px">` +
        pair((x) => ellipse(x, cy, 7, 8, ink) + circle(x + 2.5, cy - 3, 2.6, C.white)) + '</g>';
  }
}

function mouthSvg(cx: number, cy: number, mouth: Mouth): string {
  const ink = C.ink;
  const s = `stroke="${ink}" stroke-width="4.5" stroke-linecap="round" fill="none"`;
  switch (mouth) {
    case 'grin':
      return path(`M${f(cx - 14)} ${f(cy - 3)} Q${f(cx)} ${f(cy + 20)} ${f(cx + 14)} ${f(cy - 3)} Z`, '#9b4a4f') +
        path(`M${f(cx - 7)} ${f(cy + 7)} Q${f(cx)} ${f(cy + 13)} ${f(cx + 7)} ${f(cy + 7)}`, '#f08a8a');
    case 'o':
      return ellipse(cx, cy + 4, 7, 9, '#9b4a4f');
    case 'small':
      return path(`M${f(cx - 7)} ${f(cy + 1)} Q${f(cx)} ${f(cy + 7)} ${f(cx + 7)} ${f(cy + 1)}`, 'none', s);
    case 'worried':
      return path(`M${f(cx - 10)} ${f(cy + 5)} Q${f(cx - 5)} ${f(cy)} ${f(cx)} ${f(cy + 4)} Q${f(cx + 5)} ${f(cy + 8)} ${f(cx + 10)} ${f(cy + 3)}`, 'none', s);
    case 'sleepy':
      return path(`M${f(cx - 6)} ${f(cy + 2)} Q${f(cx)} ${f(cy + 6)} ${f(cx + 6)} ${f(cy + 2)}`, 'none', s);
    default:
      return path(`M${f(cx - 12)} ${f(cy)} Q${f(cx)} ${f(cy + 12)} ${f(cx + 12)} ${f(cy)}`, 'none', s);
  }
}

/** Hair drawn behind the head (floats up in space). */
function hairBack(style: HairStyle, cx: number, cy: number, r: number, col: string): string {
  const dk = shade(col, -0.18);
  switch (style) {
    case 'puffs':
      return circle(cx - r * 0.86, cy - r * 0.86, r * 0.5, col) + circle(cx + r * 0.86, cy - r * 0.86, r * 0.5, col) +
        circle(cx - r * 0.98, cy - r * 1.0, r * 0.22, shade(col, 0.12)) + circle(cx + r * 0.74, cy - r * 1.06, r * 0.2, shade(col, 0.12));
    case 'cloud':
      return path(`M${f(cx - r * 1.05)} ${f(cy + r * 0.3)}
        C${f(cx - r * 1.5)} ${f(cy - r * 0.2)} ${f(cx - r * 1.45)} ${f(cy - r * 1.3)} ${f(cx - r * 0.75)} ${f(cy - r * 1.35)}
        C${f(cx - r * 0.55)} ${f(cy - r * 1.95)} ${f(cx + r * 0.35)} ${f(cy - r * 1.95)} ${f(cx + r * 0.55)} ${f(cy - r * 1.45)}
        C${f(cx + r * 1.4)} ${f(cy - r * 1.6)} ${f(cx + r * 1.6)} ${f(cy - r * 0.5)} ${f(cx + r * 1.08)} ${f(cy + r * 0.25)}
        Z`, col) +
        path(`M${f(cx - r * 0.6)} ${f(cy - r * 1.3)} Q${f(cx - r * 0.2)} ${f(cy - r * 1.7)} ${f(cx + r * 0.3)} ${f(cy - r * 1.42)}`, 'none', `stroke="${dk}" stroke-width="5" stroke-linecap="round"`);
    case 'curls': {
      let s = '';
      const n = 13;
      for (let i = 0; i < n; i++) {
        const a = Math.PI * (0.92 + (i / (n - 1)) * 1.16);
        s += circle(cx + Math.cos(a) * r * 1.02, cy + Math.sin(a) * r * 1.02 - r * 0.08, r * 0.36, i % 2 ? col : shade(col, 0.06));
      }
      return s;
    }
    case 'bob':
      return path(`M${f(cx - r * 1.08)} ${f(cy + r * 0.55)} Q${f(cx - r * 1.32)} ${f(cy + r * 0.2)} ${f(cx - r * 1.1)} ${f(cy - r * 0.3)}
        Q${f(cx)} ${f(cy - r * 1.55)} ${f(cx + r * 1.1)} ${f(cy - r * 0.3)} Q${f(cx + r * 1.32)} ${f(cy + r * 0.2)} ${f(cx + r * 1.08)} ${f(cy + r * 0.55)} Z`, col);
    case 'bun':
      return circle(cx + r * 0.1, cy - r * 1.18, r * 0.42, col) + circle(cx + r * 0.22, cy - r * 1.3, r * 0.16, shade(col, 0.14)) +
        path(`M${f(cx - r * 0.5)} ${f(cy - r * 1.35)} q${f(-r * 0.3)} ${f(-r * 0.25)} ${f(-r * 0.2)} ${f(-r * 0.55)}`, 'none', `stroke="${col}" stroke-width="6" stroke-linecap="round"`);
    case 'tuft':
      return path(`M${f(cx - r * 0.3)} ${f(cy - r * 0.9)} q${f(-r * 0.15)} ${f(-r * 0.55)} ${f(r * 0.05)} ${f(-r * 0.75)} q${f(r * 0.05)} ${f(r * 0.35)} ${f(r * 0.2)} ${f(r * 0.2)}
        q${f(r * 0.1)} ${f(-r * 0.45)} ${f(r * 0.4)} ${f(-r * 0.5)} q${f(-r * 0.1)} ${f(r * 0.4)} ${f(r * 0.1)} ${f(r * 0.5)} q${f(r * 0.3)} ${f(-r * 0.2)} ${f(r * 0.45)} ${f(-r * 0.1)} q${f(-r * 0.1)} ${f(r * 0.3)} ${f(-r * 0.2)} ${f(r * 0.65)} Z`, col);
    case 'swoop':
      return path(`M${f(cx + r * 0.2)} ${f(cy - r * 0.95)} q${f(r * 0.6)} ${f(-r * 0.45)} ${f(r * 0.95)} ${f(-r * 0.15)} q${f(-r * 0.3)} ${f(-r * 0.05)} ${f(-r * 0.4)} ${f(r * 0.2)} Z`, col);
    default:
      return '';
  }
}

/** Hair cap and fringe drawn over the head. */
function hairFront(style: HairStyle, cx: number, cy: number, r: number, col: string): string {
  const hi = shade(col, 0.16);
  const capTop = cy - r * 1.06;
  const cap = (fringe: string) => path(`M${f(cx - r * 1.03)} ${f(cy + r * 0.05)} C${f(cx - r * 1.08)} ${f(capTop - r * 0.25)} ${f(cx + r * 1.08)} ${f(capTop - r * 0.25)} ${f(cx + r * 1.03)} ${f(cy + r * 0.05)} ${fringe} Z`, col);
  switch (style) {
    case 'puffs':
      return cap(`Q${f(cx + r * 0.8)} ${f(cy - r * 0.55)} ${f(cx + r * 0.05)} ${f(cy - r * 0.62)} Q${f(cx - r * 0.75)} ${f(cy - r * 0.6)} ${f(cx - r * 1.03)} ${f(cy + r * 0.05)}`) +
        path(`M${f(cx)} ${f(capTop - 2)} L${f(cx + 1)} ${f(cy - r * 0.62)}`, 'none', `stroke="${shade(col, -0.25)}" stroke-width="3"`) +
        circle(cx - r * 0.62, cy - r * 0.62, 7, C.rose) + circle(cx + r * 0.62, cy - r * 0.62, 7, C.rose);
    case 'cloud':
      return cap(`Q${f(cx + r * 0.6)} ${f(cy - r * 0.35)} ${f(cx + r * 0.25)} ${f(cy - r * 0.62)} Q${f(cx - r * 0.2)} ${f(cy - r * 0.3)} ${f(cx - r * 0.55)} ${f(cy - r * 0.55)} Q${f(cx - r * 0.85)} ${f(cy - r * 0.3)} ${f(cx - r * 1.03)} ${f(cy + r * 0.05)}`) +
        path(`M${f(cx - r * 0.5)} ${f(capTop + 8)} Q${f(cx)} ${f(capTop - 4)} ${f(cx + r * 0.45)} ${f(capTop + 10)}`, 'none', `stroke="${hi}" stroke-width="5" stroke-linecap="round"`);
    case 'curls': {
      let s = cap(`Q${f(cx)} ${f(cy - r * 0.5)} ${f(cx - r * 1.03)} ${f(cy + r * 0.05)}`);
      for (let i = 0; i < 6; i++) s += circle(cx - r * 0.62 + i * r * 0.25, cy - r * 0.62 + (i % 2) * 6, r * 0.2, i % 2 ? col : hi);
      return s;
    }
    case 'bob':
      return cap(`L${f(cx + r * 0.95)} ${f(cy - r * 0.35)} Q${f(cx)} ${f(cy - r * 0.48)} ${f(cx - r * 0.95)} ${f(cy - r * 0.35)} Z`) +
        path(`M${f(cx - r * 0.55)} ${f(capTop + 10)} Q${f(cx)} ${f(capTop)} ${f(cx + r * 0.5)} ${f(capTop + 12)}`, 'none', `stroke="${hi}" stroke-width="5" stroke-linecap="round"`);
    case 'bun':
      return cap(`Q${f(cx + r * 0.5)} ${f(cy - r * 0.5)} ${f(cx)} ${f(cy - r * 0.58)} Q${f(cx - r * 0.5)} ${f(cy - r * 0.5)} ${f(cx - r * 1.03)} ${f(cy + r * 0.05)}`);
    case 'tuft':
    case 'short':
      return cap(`Q${f(cx + r * 0.7)} ${f(cy - r * 0.6)} ${f(cx + r * 0.3)} ${f(cy - r * 0.7)} Q${f(cx + r * 0.1)} ${f(cy - r * 0.55)} ${f(cx - r * 0.1)} ${f(cy - r * 0.72)} Q${f(cx - r * 0.6)} ${f(cy - r * 0.62)} ${f(cx - r * 1.03)} ${f(cy + r * 0.05)}`);
    case 'swoop':
      return cap(`Q${f(cx + r * 0.6)} ${f(cy - r * 0.75)} ${f(cx - r * 0.2)} ${f(cy - r * 0.42)} Q${f(cx - r * 0.75)} ${f(cy - r * 0.35)} ${f(cx - r * 1.03)} ${f(cy + r * 0.05)}`) +
        path(`M${f(cx - r * 0.2)} ${f(capTop + 10)} Q${f(cx + r * 0.3)} ${f(capTop + 4)} ${f(cx + r * 0.7)} ${f(capTop + 20)}`, 'none', `stroke="${hi}" stroke-width="5" stroke-linecap="round"`);
  }
}

export function headSvg(who: Who, av: Avatar, cx: number, cy: number, eyes: Eyes, mouth: Mouth, brows = false, r?: number): string {
  const b = BODY[who];
  const R = r ?? b.headR;
  const skin = SKIN[av.skin] ?? SKIN[1];
  const skinD = SKIN_SHADE[av.skin] ?? SKIN_SHADE[1];
  const hair = HAIR[av.hairColor] ?? HAIR[2];
  const k = R / b.headR;
  return [
    hairBack(av.hair, cx, cy, R, hair),
    circle(cx - R * 0.98, cy + R * 0.12, R * 0.2, skinD),
    circle(cx + R * 0.98, cy + R * 0.12, R * 0.2, skinD),
    circle(cx, cy, R, skin),
    path(`M${f(cx - R * 0.8)} ${f(cy + R * 0.55)} Q${f(cx)} ${f(cy + R * 1.08)} ${f(cx + R * 0.8)} ${f(cy + R * 0.55)}`, skinD, 'opacity="0.35"'),
    hairFront(av.hair, cx, cy, R, hair),
    ellipse(cx - R * 0.56, cy + R * 0.4, 11 * k, 7 * k, C.rose, 'opacity="0.55"'),
    ellipse(cx + R * 0.56, cy + R * 0.4, 11 * k, 7 * k, C.rose, 'opacity="0.55"'),
    brows ? path(`M${f(cx - 30 * k)} ${f(cy - 12 * k)} L${f(cx - 14 * k)} ${f(cy - 17 * k)} M${f(cx + 30 * k)} ${f(cy - 12 * k)} L${f(cx + 14 * k)} ${f(cy - 17 * k)}`, 'none', `stroke="${C.ink}" stroke-width="4" stroke-linecap="round"`) : '',
    eyesSvg(cx, cy + 6 * k, eyes, k),
    path(`M${f(cx - 3 * k)} ${f(cy + 18 * k)} Q${f(cx)} ${f(cy + 22 * k)} ${f(cx + 3 * k)} ${f(cy + 18 * k)}`, 'none', `stroke="${skinD}" stroke-width="3" stroke-linecap="round"`),
    `<g transform="translate(${f(cx)} ${f(cy + 30 * k)}) scale(${f(k)}) translate(${f(-cx)} ${f(-(cy + 30 * k))})">${mouthSvg(cx, cy + 30 * k, mouth)}</g>`,
  ].join('');
}

function shirtFill(av: Avatar, pj: boolean, id: string): { defs: string; fill: string } {
  const col = SHIRT[av.shirt] ?? SHIRT[0];
  if (!pj) return { defs: '', fill: col };
  const defs = `<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${shade(col, 0.45)}"/><rect width="22" height="9" fill="${shade(col, 0.1)}"/><circle cx="16" cy="16" r="2.4" fill="${C.white}"/></pattern>`;
  return { defs, fill: `url(#${id})` };
}

let pjCount = 0;

/** A whole child. Returns an SVG for a 300 x 420 box. */
export function kidSvg(who: Who, av: Avatar, poseName: string, opts: { eyes?: Eyes } = {}): string {
  const b = BODY[who];
  const pose = POSES[poseName] ?? POSES.float;
  const cx = 150;
  const skin = SKIN[av.skin] ?? SKIN[1];
  const { defs, fill: shirt } = shirtFill(av, !!pose.pj, `pj${who}${pjCount++}`);
  const pants = pose.pj ? shirt : PANTS;
  const sleeve = pose.pj ? shade(SHIRT[av.shirt] ?? SHIRT[0], 0.2) : shirt;
  const shY = b.torsoTop + 20;
  const shX = b.torsoW / 2 - 8;
  const hipY = b.torsoTop + b.torsoH - 8;
  const parts: string[] = [];
  if (pose.lines) {
    for (let i = 0; i < 3; i++) parts.push(path(`M${f(20 + i * 8)} ${f(190 + i * 40)} h${f(-60 + i * 10)}`, 'none', `stroke="${C.white}" stroke-width="8" stroke-linecap="round" opacity="0.7"`));
  }
  // legs
  for (const side of [-1, 1] as const) {
    const L = limb(cx + side * b.hip, hipY, side < 0 ? pose.legL : pose.legR, b.legLen, side, pose.bend);
    parts.push(path(L.d, 'none', `stroke="${pants}" stroke-width="${b.legW}" stroke-linecap="round"`));
    parts.push(ellipse(L.ex, L.ey + 4, b.legW * 0.62, b.legW * 0.5, SOCK) + ellipse(L.ex, L.ey - 4, b.legW * 0.55, 5, SHIRT[(av.shirt + 3) % SHIRT.length]));
  }
  // torso
  parts.push(rect(cx - b.torsoW / 2, b.torsoTop, b.torsoW, b.torsoH, 36, shirt));
  if (!pose.pj) {
    parts.push(rect(cx - b.torsoW / 2, b.torsoTop + b.torsoH - 30, b.torsoW, 30, 14, PANTS));
    parts.push(rect(cx - 12, b.torsoTop + 14, 24, 10, 5, shade(shirt, 0.35), 'opacity="0.8"')); // collar badge
    parts.push(circle(cx + b.torsoW * 0.22, b.torsoTop + 46, 9, C.white, 'opacity="0.85"') + circle(cx + b.torsoW * 0.22, b.torsoTop + 46, 4.5, C.sunflower));
  }
  // arms
  for (const side of [-1, 1] as const) {
    const ang = side < 0 ? pose.armL : pose.armR;
    const A = limb(cx + side * shX, shY, ang, b.armLen, side, 10);
    const arm = path(A.d, 'none', `stroke="${sleeve}" stroke-width="${b.armW}" stroke-linecap="round"`) + circle(A.ex, A.ey, b.armW * 0.62, skin);
    if (side > 0 && pose.waveR) parts.push(`<g class="wave-arm" style="transform-origin:${f(cx + shX)}px ${f(shY)}px">${arm}</g>`);
    else parts.push(arm);
  }
  // head
  parts.push(headSvg(who, av, cx, b.headY, opts.eyes ?? pose.eyes, pose.mouth, pose.brows));
  return svgDoc('0 0 300 420', (defs ? `<defs>${defs}</defs>` : '') + parts.join(''));
}

/** A child snug in a sleeping bag strapped to the wall. */
export function kidInBagSvg(who: Who, av: Avatar, opts: { asleep?: boolean; upside?: boolean } = {}): string {
  const bagCol = shade(SHIRT[av.shirt] ?? SHIRT[0], 0.18);
  const bagD = shade(bagCol, -0.15);
  const head = headSvg(who, av, 150, 112, opts.asleep ? 'closed' : 'happy', opts.asleep ? 'sleepy' : 'smile', false, who === 'A' ? 58 : 60);
  const bag = [
    rect(70, 150, 160, 250, 70, bagCol),
    rect(86, 170, 128, 210, 56, shade(bagCol, 0.15), 'opacity="0.6"'),
    path('M150 160 L150 390', 'none', `stroke="${bagD}" stroke-width="4" stroke-dasharray="4 8"`),
    rect(62, 230, 176, 16, 8, C.velcro), rect(62, 320, 176, 16, 8, C.velcro),
    rect(92, 140, 116, 34, 17, bagD),
  ].join('');
  const inner = `<g ${opts.upside ? 'transform="rotate(180 150 206)"' : ''}>${bag}${head}</g>`;
  return svgDoc('0 0 300 420', inner);
}

/** Just a head, for badges, cards and the avatar picker. */
export function kidFaceSvg(who: Who, av: Avatar, eyes: Eyes = 'open', mouth: Mouth = 'smile'): string {
  return svgDoc('0 0 200 200', headSvg(who, av, 100, 112, eyes, mouth, false, 58));
}
