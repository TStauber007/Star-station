// Button, the crew's helper robot. Round, mint green, a glowing tummy button.
import { C, shade } from './palette.ts';
import { circle, ellipse, f, path, rect, svgDoc } from './svg.ts';

export const ROBOT_MOODS = [
  'none', 'hidden', 'peek', 'shy', 'happy', 'wave', 'spin', 'giggle', 'sad', 'sleepy', 'scared', 'brave',
  'look', 'dance', 'charge', 'fix', 'worry', 'wait', 'telescope', 'squish', 'blanket', 'mask', 'rest', 'dream', 'glow',
] as const;

type Eyes = 'round' | 'happy' | 'down' | 'sleepy' | 'wide' | 'up' | 'determined' | 'closed' | 'side' | 'stars';

interface Mood {
  eyes: Eyes;
  mouth: 'smile' | 'grin' | 'flat' | 'o' | 'wobble' | 'none';
  armL: number; // degrees from down
  armR: number;
  tummy: number; // glow 0..1
  tummyColor?: string;
  antenna: 'up' | 'droop' | 'wobble';
  mask?: boolean;
  wrench?: boolean;
  plug?: boolean;
}

const MOODS: Record<string, Mood> = {
  happy: { eyes: 'happy', mouth: 'smile', armL: 40, armR: 40, tummy: 1, antenna: 'up' },
  shy: { eyes: 'down', mouth: 'flat', armL: 12, armR: 12, tummy: 0.45, antenna: 'droop' },
  peek: { eyes: 'side', mouth: 'none', armL: 20, armR: 20, tummy: 0.4, antenna: 'up' },
  wave: { eyes: 'happy', mouth: 'grin', armL: 150, armR: 150, tummy: 1, antenna: 'up' },
  spin: { eyes: 'happy', mouth: 'grin', armL: 110, armR: 110, tummy: 1, antenna: 'up' },
  giggle: { eyes: 'closed', mouth: 'grin', armL: 60, armR: 60, tummy: 1, antenna: 'wobble' },
  sad: { eyes: 'down', mouth: 'flat', armL: 8, armR: 8, tummy: 0.15, antenna: 'droop' },
  sleepy: { eyes: 'sleepy', mouth: 'flat', armL: 6, armR: 6, tummy: 0.2, antenna: 'droop' },
  scared: { eyes: 'wide', mouth: 'wobble', armL: 120, armR: 120, tummy: 0.5, antenna: 'wobble' },
  brave: { eyes: 'determined', mouth: 'smile', armL: 30, armR: 70, tummy: 0.8, antenna: 'up' },
  look: { eyes: 'up', mouth: 'o', armL: 30, armR: 30, tummy: 0.9, antenna: 'up' },
  dance: { eyes: 'happy', mouth: 'grin', armL: 140, armR: 60, tummy: 1, antenna: 'wobble' },
  charge: { eyes: 'happy', mouth: 'smile', armL: 20, armR: 20, tummy: 0.7, antenna: 'up', plug: true },
  fix: { eyes: 'determined', mouth: 'smile', armL: 30, armR: 100, tummy: 0.9, antenna: 'up', wrench: true },
  worry: { eyes: 'round', mouth: 'o', armL: 20, armR: 20, tummy: 0.6, antenna: 'droop' },
  wait: { eyes: 'up', mouth: 'flat', armL: 14, armR: 14, tummy: 0.6, antenna: 'up' },
  telescope: { eyes: 'side', mouth: 'o', armL: 70, armR: 90, tummy: 1, antenna: 'up' },
  squish: { eyes: 'closed', mouth: 'o', armL: 140, armR: 40, tummy: 0.6, antenna: 'wobble' },
  mask: { eyes: 'round', mouth: 'smile', armL: 20, armR: 20, tummy: 0.5, antenna: 'up', mask: true },
  rest: { eyes: 'closed', mouth: 'smile', armL: 10, armR: 10, tummy: 0.35, antenna: 'droop', mask: true },
  dream: { eyes: 'stars', mouth: 'smile', armL: 10, armR: 10, tummy: 0.3, antenna: 'droop' },
  glow: { eyes: 'happy', mouth: 'smile', armL: 40, armR: 40, tummy: 1, tummyColor: '#ff9fc8', antenna: 'up' },
};

const rad = (d: number) => (d * Math.PI) / 180;

function eyes(e: Eyes, cx: number, cy: number): string {
  const col = C.botEye;
  const pair = (fn: (x: number) => string) => fn(cx - 26) + fn(cx + 26);
  const st = `stroke="${col}" stroke-width="7" stroke-linecap="round" fill="none"`;
  switch (e) {
    case 'happy': return pair((x) => path(`M${x - 11} ${cy + 5} Q${x} ${cy - 10} ${x + 11} ${cy + 5}`, 'none', st));
    case 'closed': return pair((x) => path(`M${x - 11} ${cy - 2} Q${x} ${cy + 8} ${x + 11} ${cy - 2}`, 'none', st));
    case 'down': return pair((x) => ellipse(x, cy + 6, 8, 9, col));
    case 'sleepy': return pair((x) => rect(x - 11, cy + 2, 22, 7, 3.5, col));
    case 'wide': return pair((x) => ellipse(x, cy, 12, 14, col) + circle(x + 3, cy - 4, 3.5, C.white));
    case 'up': return pair((x) => ellipse(x + 1, cy - 5, 9, 11, col) + circle(x + 3, cy - 9, 3, C.white));
    case 'side': return pair((x) => ellipse(x + 7, cy, 9, 11, col));
    case 'determined': return pair((x) => ellipse(x, cy + 2, 9, 10, col)) +
      path(`M${cx - 38} ${cy - 16} L${cx - 16} ${cy - 11} M${cx + 38} ${cy - 16} L${cx + 16} ${cy - 11}`, 'none', `stroke="${col}" stroke-width="5" stroke-linecap="round"`);
    case 'stars': {
      const sp = (x: number, y: number, r: number) => path(`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z`, '#ffe9a8');
      return `<g class="twinkle-slow">${sp(cx - 30, cy - 4, 9)}${sp(cx + 8, cy + 6, 7)}${sp(cx + 34, cy - 8, 6)}</g>`;
    }
    default: return `<g class="blink" style="transform-origin:${cx}px ${cy}px">${pair((x) => ellipse(x, cy, 9, 11, col) + circle(x + 3, cy - 4, 3, C.white))}</g>`;
  }
}

function mouth(m: Mood['mouth'], cx: number, cy: number): string {
  const col = C.botEye;
  const st = `stroke="${col}" stroke-width="5" stroke-linecap="round" fill="none"`;
  switch (m) {
    case 'smile': return path(`M${cx - 14} ${cy} Q${cx} ${cy + 11} ${cx + 14} ${cy}`, 'none', st);
    case 'grin': return path(`M${cx - 17} ${cy - 2} Q${cx} ${cy + 18} ${cx + 17} ${cy - 2} Z`, col, 'opacity="0.9"');
    case 'flat': return path(`M${cx - 10} ${cy + 3} L${cx + 10} ${cy + 3}`, 'none', st);
    case 'o': return ellipse(cx, cy + 4, 6, 7, col);
    case 'wobble': return path(`M${cx - 14} ${cy + 4} Q${cx - 7} ${cy - 3} ${cx} ${cy + 4} Q${cx + 7} ${cy + 11} ${cx + 14} ${cy + 4}`, 'none', st);
    default: return '';
  }
}

function arm(side: -1 | 1, deg: number, body: string): string {
  const sx = 120 + side * 86, sy = 158;
  const a = rad(deg) * side;
  const ex = sx + Math.sin(a) * 56, ey = sy + Math.cos(a) * 56;
  return path(`M${f(sx)} ${f(sy)} L${f(ex)} ${f(ey)}`, 'none', `stroke="${shade(body, -0.12)}" stroke-width="16" stroke-linecap="round"`) +
    circle(ex, ey, 14, shade(body, 0.12)) + circle(ex - 3, ey - 4, 5, C.white, 'opacity="0.5"');
}

/** Button. Returns an SVG for a 240 x 270 box. */
export function robotSvg(moodName: string): string {
  const m = MOODS[moodName] ?? MOODS.happy;
  const body = C.bot0;
  const cx = 120, cy = 150;
  const parts: string[] = [];
  // fan glow underneath (it floats on tiny fans)
  parts.push(ellipse(cx, 252, 46, 9, C.botEye, 'opacity="0.25"'));
  // antenna
  const tip = m.antenna === 'droop' ? { x: 152, y: 46 } : { x: 128, y: 30 };
  const antCls = m.antenna === 'wobble' ? 'class="wobble-fast" style="transform-origin:120px 70px"' : '';
  parts.push(`<g ${antCls}>` + path(`M120 72 Q${m.antenna === 'droop' ? '128 40' : '122 50'} ${tip.x} ${tip.y}`, 'none', `stroke="${C.metalDark}" stroke-width="6" stroke-linecap="round"`) +
    circle(tip.x, tip.y, 13, C.botAntenna, 'class="antenna-light"') + circle(tip.x - 4, tip.y - 4, 4, C.white, 'opacity="0.7"') + '</g>');
  // arms behind body
  parts.push(arm(-1, m.armL, body));
  parts.push(arm(1, m.armR, body));
  // body
  parts.push(circle(cx, cy, 90, body));
  parts.push(path(`M${cx - 84} ${cy + 30} Q${cx} ${cy + 125} ${cx + 84} ${cy + 30} Q${cx} ${cy + 85} ${cx - 84} ${cy + 30}Z`, C.bot1, 'opacity="0.8"'));
  parts.push(ellipse(cx - 40, cy - 52, 26, 14, C.white, 'opacity="0.35" transform="rotate(-30 80 98)"'));
  // side fan vents
  for (const s of [-1, 1]) parts.push(circle(cx + s * 78, cy + 8, 12, C.bot2) + path(`M${cx + s * 78 - 7} ${cy + 8} h14 M${cx + s * 78} ${cy + 1} v14`, 'none', `stroke="${C.bot1}" stroke-width="3"`));
  // screen face
  parts.push(rect(cx - 62, cy - 62, 124, 82, 34, C.botScreen));
  parts.push(rect(cx - 56, cy - 57, 112, 18, 9, C.white, 'opacity="0.06"'));
  parts.push(eyes(m.eyes, cx, cy - 26));
  parts.push(mouth(m.mouth, cx, cy + 2));
  if (m.mask) parts.push(rect(cx - 64, cy - 46, 128, 34, 17, '#8f7fd8') + path(`M${cx - 40} ${cy - 30} q12 8 24 0 M${cx + 16} ${cy - 30} q12 8 24 0`, 'none', `stroke="#d9cfff" stroke-width="4" stroke-linecap="round"`));
  // tummy button
  const tc = m.tummyColor ?? C.botTummy;
  parts.push(circle(cx, cy + 50, 28, tc, `opacity="${f(0.18 + m.tummy * 0.35)}" class="tummy-glow"`));
  parts.push(circle(cx, cy + 50, 17, m.tummy < 0.3 ? shade(tc, -0.35) : tc));
  parts.push(circle(cx - 5, cy + 45, 5, C.white, `opacity="${f(0.3 + m.tummy * 0.4)}"`));
  if (m.wrench) parts.push(`<g transform="translate(${cx + 118} ${cy - 10}) rotate(-35)">` + rect(-6, -10, 12, 60, 6, C.metalDark) + path('M-16 -18 a18 18 0 1 1 32 0 l-8 4 l-8 -10 l-8 10 z', C.metal) + '</g>');
  if (m.plug) parts.push(path(`M${cx + 70} ${cy + 60} Q${cx + 120} ${cy + 120} ${cx + 160} ${cy + 80}`, 'none', `stroke="${C.cable}" stroke-width="6" stroke-linecap="round"`));
  return svgDoc('0 -10 240 280', parts.join(''), 'overflow="visible"');
}
