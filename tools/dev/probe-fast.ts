// Dev: run one mission in fast mode and print where it gets to.
import { chromium } from '@playwright/test';
import { serveDist } from '../verify/serve.ts';
const m = process.argv[2] ?? 'space-garden';
const { url, server } = await serveDist();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1024, height: 768 } });
p.on('pageerror', (e) => console.log('PAGEERROR', String(e)));
p.on('console', (msg) => console.log('console', msg.type(), msg.text()));
await p.addInitScript(() => { (window as any).__ssPick = () => 0; });
await p.goto(`${url}/#fast&qa=fast&m=${m}`);
for (let i = 0; i < 20; i++) {
  await p.waitForTimeout(1000);
  const s = await p.evaluate(() => window.__ss && { page: window.__ss.page, beat: window.__ss.beat, phase: window.__ss.phase });
  console.log(i, JSON.stringify(s));
  if (s?.phase === 'end') break;
}
await b.close(); server.close();
