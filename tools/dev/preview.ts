// Dev helper: render art to an HTML sheet and screenshot it.
//   node tools/dev/preview.ts <name> <out.png>
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { kidSvg, kidInBagSvg, DEFAULT_AVATARS, CREW_POSES, HAIR_STYLES, kidFaceSvg } from '../../src/art/crew.ts';
import { robotSvg, ROBOT_MOODS } from '../../src/art/robot.ts';
import { cardSvg, CARDS } from '../../src/art/cards.ts';
import { stickerSvg, STICKERS } from '../../src/art/stickers.ts';

const which = process.argv[2] ?? 'crew';
const out = process.argv[3] ?? '/tmp/preview.png';
let cells: string[] = [];
const cell = (svg: string, label: string, w = 180, h = 250) =>
  `<div style="display:inline-block;margin:6px;text-align:center;font:12px sans-serif"><div style="width:${w}px;height:${h}px">${svg}</div>${label}</div>`;
if (which === 'crew') {
  for (const p of CREW_POSES.filter((p) => !['blanket', 'none', 'bed', 'bed-up', 'bed-down'].includes(p))) cells.push(cell(kidSvg('A', DEFAULT_AVATARS.A, p), 'A ' + p));
  for (const p of ['float', 'wave', 'cheer', 'look', 'pajamas']) cells.push(cell(kidSvg('T', DEFAULT_AVATARS.T, p), 'T ' + p));
  cells.push(cell(kidInBagSvg('A', DEFAULT_AVATARS.A), 'bag'));
  cells.push(cell(kidInBagSvg('T', DEFAULT_AVATARS.T, { upside: true, asleep: true }), 'bag down'));
} else if (which === 'hair') {
  HAIR_STYLES.forEach((h, i) => cells.push(cell(kidFaceSvg('A', { skin: i % 5, hair: h, hairColor: i % 6, shirt: i % 7 }), h, 150, 150)));
  HAIR_STYLES.forEach((h, i) => cells.push(cell(kidSvg('T', { skin: (i + 2) % 5, hair: h, hairColor: (i + 3) % 6, shirt: (i + 2) % 7 }, 'float'), h, 150, 210)));
} else if (which === 'cards' || which === 'cards-solo') {
  const ctx = { avatars: DEFAULT_AVATARS, crew: which === 'cards' ? 'two' as const : 'solo' as const, soloWho: 'A' as const };
  for (const c of CARDS) cells.push(`<div style="display:inline-block;margin:5px;font:12px sans-serif;text-align:center"><div style="width:200px;height:150px;border-radius:14px;overflow:hidden;border:4px solid #fff">${cardSvg(c, ctx)}</div>${c}</div>`);
} else if (which === 'stickers') {
  for (const st of STICKERS) cells.push(cell(stickerSvg(st), st, 160, 160));
} else if (which === 'robot') {
  for (const m of ROBOT_MOODS.filter((m) => !['none', 'hidden', 'blanket'].includes(m))) cells.push(cell(robotSvg(m), m, 150, 175));
}
const html = `<!doctype html><html><body style="margin:0;background:#e9e1cf"><style>body>div>div>svg{width:100%;height:100%;overflow:visible}</style>${cells.join('')}</body></html>`;
writeFileSync('/tmp/claude-preview.html', html);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.goto('file:///tmp/claude-preview.html');
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log('wrote', out);
