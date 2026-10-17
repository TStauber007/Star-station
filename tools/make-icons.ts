// Draws the app icon in code, then saves PNG sizes for tablets.
//   node tools/make-icons.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { robotSvg } from '../src/art/robot.ts';
import { earthSvg } from '../src/art/sky.ts';
import { placeSvg } from '../src/art/flat.ts';
import { sparklePath } from '../src/art/svg.ts';

function iconSvg(maskable: boolean): string {
  const r = maskable ? 0 : 112;
  const k = maskable ? 0.8 : 1; // keep Button inside the maskable safe zone
  const inner =
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232a62"/><stop offset="1" stop-color="#3b4290"/></linearGradient>` +
    `<clipPath id="cl"><rect width="512" height="512" rx="${r}"/></clipPath></defs>` +
    `<g clip-path="url(#cl)"><rect width="512" height="512" fill="url(#bg)"/>` +
    earthSvg(256, 1010, 600, 'day', { seed: 21 }) +
    [[90, 110, 14], [420, 90, 11], [440, 250, 8], [70, 300, 9], [380, 170, 6]].map(([x, y, s]) => `<path d="${sparklePath(x, y, s)}" fill="#fff6dc"/>`).join('') +
    `<g transform="translate(256 250) scale(${k}) translate(-256 -250)">` + placeSvg(robotSvg('happy'), 116, 70, 280, 326) + '</g></g>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${inner}</svg>`;
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon.svg', iconSvg(false));
const b = await chromium.launch();
const page = await b.newPage();
for (const [name, size, mask] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true], ['apple-touch-icon.png', 180, true]] as const) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${iconSvg(mask).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: true });
}
await b.close();
console.log('icons written');
