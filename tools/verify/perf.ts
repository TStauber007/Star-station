// Frame-rate check on busy scenes, with the CPU slowed down 4x to stand in
// for a mid-range tablet. Writes qa/perf-report.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { serveDist } from './serve.ts';

const scenes = [
  ['home', 'qa=home&still=0'],
  ['orbit (M1 p1)', 'qa=scene&m=welcome-aboard&p=p1&b=3&still=0'],
  ['hub with crew (M1 p11)', 'qa=scene&m=welcome-aboard&p=p11&b=4&still=0&state=%7B%22shipColor%22%3A%22yellow%22%7D'],
  ['cupola night (M4 p9)', 'qa=scene&m=turns-at-the-telescope&p=p9&b=4&still=0'],
  ['garden (M2 p8)', 'qa=scene&m=space-garden&p=p8&b=5&still=0'],
  ['choice cards (M1 p3)', 'qa=scene&m=welcome-aboard&p=p3&b=choice&still=0'],
  ['sleep cabin (M6 p7)', 'qa=scene&m=goodnight-earth&p=p7&b=0&still=0'],
];
const { url, server } = await serveDist();
const browser = await chromium.launch();
const results: Record<string, unknown>[] = [];
for (const [name, hash] of scenes) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const cdp = await page.context().newCDPSession(page);
  await page.goto(`${url}/#${hash}`);
  await page.waitForTimeout(1200);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const r = await page.evaluate(() => new Promise<{ fps: number; p95: number; long: number }>((res) => {
    const times: number[] = [];
    let last = performance.now();
    const end = last + 5000;
    const tick = (t: number) => { times.push(t - last); last = t; if (t < end) requestAnimationFrame(tick); else {
      const sorted = [...times].sort((a, b) => a - b);
      res({ fps: Math.round((times.length / 5) * 10) / 10, p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 10) / 10, long: times.filter((x) => x > 34).length });
    } };
    requestAnimationFrame(tick);
  }));
  results.push({ scene: name, ...r });
  console.log(`${name.padEnd(26)} ${r.fps} fps, 95th percentile frame ${r.p95} ms, ${r.long} frames over 34 ms`);
  await page.close();
}
await browser.close();
server.close();
mkdirSync('qa', { recursive: true });
writeFileSync('qa/perf-report.json', JSON.stringify({ note: 'Headless Chromium, 1280x800 at 2x pixel density, CPU throttled 4x. GPU work is not throttled.', results }, null, 2));
