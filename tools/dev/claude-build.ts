// Dev: play the claude.ai test build (dist-claude) on a local server, inside a
// stand-in host wrapper, with real narration read out of the packs.
import { chromium } from '@playwright/test';
import { serveDist } from '../verify/serve.ts';
const { url, server } = await serveDist('dist-claude');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1024, height: 768 } });
const errors: string[] = [];
const requests: string[] = [];
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('request', (r) => requests.push(r.url()));
await p.goto(url + '/preview.html');
await p.waitForTimeout(800);
await p.screenshot({ path: 'qa/screenshots/claude-splash.png' });
await p.locator('.big-go').click({ force: true });
await p.waitForTimeout(1200);
await p.screenshot({ path: 'qa/screenshots/claude-home.png' });
await p.locator('.mcard').nth(0).click({ force: true });
await p.waitForTimeout(600);
await p.locator('.detail .big-go').click({ force: true });
const probe = () => p.evaluate(() => ({ page: window.__ss!.page, beat: window.__ss!.beat, lit: [...document.querySelectorAll('.caption .w')].findIndex((w) => w.classList.contains('on')) }));
const seen = new Set<string>();
let litMax = -1;
for (let i = 0; i < 40; i++) {
  await p.waitForTimeout(500);
  const s = await probe();
  seen.add(`${s.page}:${s.beat}`);
  litMax = Math.max(litMax, s.lit);
}
await p.screenshot({ path: 'qa/screenshots/claude-mission1.png' });
const font = await p.evaluate(() => document.fonts.check('700 30px Andika'));
const origin = new URL(url).origin;
const outside = requests.filter((r) => !r.startsWith(origin) && !r.startsWith('data:') && !r.startsWith('blob:'));
const packs = requests.filter((r) => r.includes('/narration-packs/'));
console.log(JSON.stringify({
  beatsSeen: [...seen], highestLitWord: litMax, fontLoaded: font,
  packRequests: packs.map((r) => r.split('/').pop()), outsideRequests: outside, errors,
}, null, 1));
await b.close(); server.close();
