// Dev helper: render composed scenes at a given aspect to a contact sheet.
//   node tools/dev/scenes.ts <out.png> <aspect> [mission-id]
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { composeScene } from '../../src/art/compose.ts';
import { sceneToSvg } from '../../src/art/flat.ts';
import { DEFAULT_AVATARS } from '../../src/art/crew.ts';
import type { Mission } from '../../src/story/types.ts';

const out = process.argv[2] ?? '/tmp/scenes.png';
const aspect = Number(process.argv[3] ?? 1.333);
const only = process.argv[4];
const W = 1000 * aspect;
const ms = readdirSync('content/missions').map((f) => JSON.parse(readFileSync('content/missions/' + f, 'utf8')) as Mission);
const cells: string[] = [];
for (const m of ms) {
  if (only && m.id !== only) continue;
  for (const [pid, p] of Object.entries(m.pages)) {
    const state = { ...m.state };
    for (const o of Object.values(m.pages).flatMap((pp) => pp.choice?.options ?? [])) void o;
    const sc = composeScene(p.art, { W, state, avatars: DEFAULT_AVATARS, crew: 'two', soloWho: 'A', bedtime: m.mood === 'bedtime' });
    cells.push(`<div style="display:inline-block;margin:4px;font:11px sans-serif;width:${Math.round(220 * aspect)}px"><div class="c" style="width:${Math.round(220 * aspect)}px;height:220px">${sceneToSvg(sc, W)}</div>${m.id}/${pid}</div>`);
  }
}
writeFileSync('/tmp/claude-scenes.html', `<!doctype html><body style="margin:0;background:#ddd"><style>.c>svg{width:100%;height:100%;display:block}</style>${cells.join('')}</body>`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
await p.goto('file:///tmp/claude-scenes.html');
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log('wrote', out, cells.length);
