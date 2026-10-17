// Dev helper: screenshot app URLs.  node tools/dev/shot.ts <out.png> <w> <h> <hash>
import { chromium } from '@playwright/test';
const [out, w, h, hash] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 });
const errs: string[] = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
await p.goto(`http://localhost:4173/#${hash}`);
await p.waitForTimeout(1200);
await p.screenshot({ path: out });
await b.close();
if (errs.length) console.log('ERRORS:', errs.join('\n'));
console.log('ok', out);
