// Dev: lights-out flow. Finish a mission with lights-out on, reload, unlock.
import { chromium } from '@playwright/test';
import { serveDist } from '../verify/serve.ts';
const out = process.argv[2] ?? '/tmp';
const { url, server } = await serveDist();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1024, height: 768 } });
p.on('pageerror', (e) => console.log('PAGEERROR', String(e)));
await p.addInitScript(() => { (window as any).__ssPick = () => 0; });
await p.goto(`${url}/#fast&qa=fast&m=goodnight-earth&lightsOut=1`);
await p.waitForFunction(() => window.__ss?.phase === 'end', null, { timeout: 60000 });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/lo1-ending.png` });
const btn = await p.locator('.end-buttons button').allTextContents();
console.log('ending buttons:', btn);
const locked = await p.evaluate(() => JSON.parse(localStorage.getItem('star-station:v1')!).lockedAt);
console.log('locked at end:', !!locked);
// a fresh start of the app (not QA): should open on lights out
await p.goto(`${url}/?again=1`);
await p.waitForTimeout(600);
await p.locator('.big-go').click({ force: true });
await p.waitForTimeout(1200);
console.log('after restart, screen:', await p.evaluate(() => document.querySelector('.screen:last-child')?.className));
await p.screenshot({ path: `${out}/lo2-locked.png` });
// grown-up holds the button for 3 seconds
const g = p.locator('.grownup');
const box = (await g.boundingBox())!;
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await p.mouse.down(); await p.waitForTimeout(3300); await p.mouse.up();
await p.waitForTimeout(800);
console.log('after hold, screen:', await p.evaluate(() => document.querySelector('.screen:last-child')?.className));
console.log('locked after hold:', await p.evaluate(() => JSON.parse(localStorage.getItem('star-station:v1')!).lockedAt));
await p.locator('.parent .done').click();
await p.waitForTimeout(800);
console.log('after Done, screen:', await p.evaluate(() => document.querySelector('.screen:last-child')?.className));
await b.close(); server.close();
