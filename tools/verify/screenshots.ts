// Screenshots of every scene at tablet sizes, with automatic layout checks.
//   node tools/verify/screenshots.ts            all sizes
//   node tools/verify/screenshots.ts --quick    one size
// Writes qa/screenshots/... (not committed) and qa/screenshot-report.json.
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { chromium, type Page } from '@playwright/test';
import type { Mission } from '../../src/story/types.ts';
import { allPaths, activeBeats } from '../../src/story/paths.ts';
import { serveDist } from './serve.ts';

const SIZES = [
  { name: 'ipad-landscape-1024x768', w: 1024, h: 768 },
  { name: 'ipad-portrait-768x1024', w: 768, h: 1024 },
  { name: 'android10-landscape-1280x800', w: 1280, h: 800 },
  { name: 'android10-portrait-800x1280', w: 800, h: 1280 },
];
const quick = process.argv.includes('--quick');
const sizes = quick ? SIZES.slice(0, 1) : SIZES;
const missions = readdirSync('content/missions').map((f) => JSON.parse(readFileSync('content/missions/' + f, 'utf8')) as Mission).sort((a, b) => a.order - b.order);

interface Shot { id: string; hash: string; file: string }
const shots: Shot[] = [];
const add = (dir: string, id: string, hash: string) => shots.push({ id: `${dir}/${id}`, hash, file: `${dir}/${id}.png` });

add('screens', 'splash', 'qa=splash');
add('screens', 'home', 'qa=home');
add('screens', 'home-stickers', 'qa=home&stickers=all');
add('screens', 'wall', 'qa=wall&stickers=all');
add('screens', 'wall-empty', 'qa=wall');
add('screens', 'parent', 'qa=parent');
add('screens', 'lightsout', 'qa=lightsout');
for (const m of missions) {
  // the state the story has when it first reaches each page
  const firstState = new Map<string, Record<string, string>>();
  const states = new Map<string, Set<string>>();
  for (const p of allPaths(m)) {
    let st = { ...m.state };
    for (const step of p.steps) {
      if (!firstState.has(step.pageId)) firstState.set(step.pageId, { ...st });
      (states.get(step.pageId) ?? states.set(step.pageId, new Set()).get(step.pageId)!).add(JSON.stringify(st));
      if (step.chose !== undefined) st = { ...st, ...(m.pages[step.pageId].choice!.options[step.chose].set ?? {}) };
    }
  }
  const dir = m.id;
  add(dir, '00-title', `qa=title&m=${m.id}`);
  for (const [pid, page] of Object.entries(m.pages)) {
    const st = firstState.get(pid) ?? m.state;
    const enc = encodeURIComponent(JSON.stringify(st));
    const beats = activeBeats(page, st);
    add(dir, `${pid}-a-start`, `qa=scene&m=${m.id}&p=${pid}&b=${page.beats.indexOf(beats[0])}&state=${enc}`);
    beats.forEach((b) => { if (b.do || b.tap) add(dir, `${pid}-b${page.beats.indexOf(b)}-${b.do ? 'do' : 'tap'}`, `qa=scene&m=${m.id}&p=${pid}&b=${page.beats.indexOf(b)}&state=${enc}`); });
    add(dir, `${pid}-z-${page.choice ? 'choice' : 'end'}`, `qa=scene&m=${m.id}&p=${pid}&b=${page.choice ? 'choice' : 'end'}&state=${enc}`);
    if (page.choice) add(dir, `${pid}-z-choice-solo`, `qa=scene&m=${m.id}&p=${pid}&b=choice&crew=solo&who=T&state=${enc}`);
    // pages whose picture depends on an earlier choice: one shot per variant
    if (page.end || /\$/.test(JSON.stringify(page.art))) {
      [...(states.get(pid) ?? [])].slice(1).forEach((s, k) => add(dir, `${pid}-z-variant${k + 1}`, `qa=scene&m=${m.id}&p=${pid}&b=end&state=${encodeURIComponent(s)}`));
    }
  }
  add(dir, 'zz-ending', `qa=ending&m=${m.id}&state=${encodeURIComponent(JSON.stringify(m.state))}`);
}

// in-page layout checks
async function check(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const vw = innerWidth, vh = innerHeight;
    const vis = (el: Element) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
    const kidTargets = document.querySelectorAll('.ctl, .card:not([disabled]), .target, .arrow, .pill:not(.small), .mcard, .big-go, .resume, .slot');
    kidTargets.forEach((el) => {
      if (!vis(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width < 88 || r.height < 88) out.push(`small target ${el.className} ${Math.round(r.width)}x${Math.round(r.height)}`);
      if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) {
        if (!el.classList.contains('target')) out.push(`off-screen ${el.className} ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`);
      }
    });
    // every button a child might tap must really be tappable at its centre
    kidTargets.forEach((el) => {
      if (!vis(el) || (el as HTMLButtonElement).disabled) return;
      const r = el.getBoundingClientRect();
      const cx = Math.min(vw - 2, Math.max(1, r.left + r.width / 2)), cy = Math.min(vh - 2, Math.max(1, r.top + r.height / 2));
      const top = document.elementFromPoint(cx, cy);
      if (top && top !== el && !el.contains(top)) out.push(`covered button ${el.className} (by ${top.className || top.tagName})`);
    });
    document.querySelectorAll('.target').forEach((el) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 30 || cy < 30 || cx > vw - 30 || cy > vh - 30) out.push(`target centre off-screen ${Math.round(cx)},${Math.round(cy)}`);
      const cap = document.querySelector('.caption:not(.hidden)')?.getBoundingClientRect();
      if (cap && cy > cap.top && cy < cap.bottom && cx > cap.left && cx < cap.right) out.push('target centre hidden under caption');
    });
    const cap = document.querySelector('.caption:not(.hidden)');
    if (cap && vis(cap)) {
      const r = cap.getBoundingClientRect();
      if (r.bottom > vh + 1 || r.left < 0 || r.right > vw) out.push('caption off-screen');
      const text = cap.querySelector('.caption-text') as HTMLElement;
      if (text && text.scrollHeight > text.clientHeight + 4) out.push('caption text clipped');
      if (r.height > vh * 0.32) out.push(`caption too tall ${Math.round(r.height)}px`);
      const fs = parseFloat(getComputedStyle(text).fontSize);
      if (fs < 20) out.push(`caption font ${fs}px`);
      for (const sel of ['.turn:not(.hidden)', '.ctl-row', '.arrow:not(.hidden)']) {
        document.querySelectorAll(sel).forEach((o) => {
          if (!vis(o)) return;
          const q = o.getBoundingClientRect();
          if (q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) out.push(`caption overlaps ${sel}`);
        });
      }
    }
    document.querySelectorAll('.card').forEach((c) => {
      document.querySelectorAll('.card').forEach((d) => {
        if (c === d) return;
        const a = c.getBoundingClientRect(), b = d.getBoundingClientRect();
        if (a.left < b.right - 2 && a.right > b.left + 2 && a.top < b.bottom - 2 && a.bottom > b.top + 2) out.push('choice cards overlap');
      });
      const r = c.getBoundingClientRect();
      const cap2 = document.querySelector('.caption:not(.hidden)')?.getBoundingClientRect();
      if (cap2 && r.bottom > cap2.top + 2 && r.top < cap2.bottom) out.push('choice card under caption');
    });
    if (document.documentElement.scrollWidth > vw + 1) out.push('horizontal scroll');
    return [...new Set(out)];
  });
}

const { url, server } = await serveDist();
const browser = await chromium.launch();
const report: Record<string, Record<string, string[]>> = {};
let problems = 0;
for (const size of sizes) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1, hasTouch: true });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  report[size.name] = {};
  for (const s of shots) {
    errors.length = 0;
    await page.goto(`${url}/?r=${Math.random()}#${s.hash}`);
    await page.waitForTimeout(s.hash.includes('ending') ? 1800 : 450);
    const path = `qa/screenshots/${size.name}/${s.file}`;
    mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
    await page.screenshot({ path });
    const issues = [...(await check(page)), ...errors.map((e) => `page error: ${e}`)];
    if (issues.length) { report[size.name][s.id] = issues; problems += issues.length; }
  }
  await ctx.close();
  console.log(`${size.name}: ${shots.length} screenshots, ${Object.keys(report[size.name]).length} with issues`);
}

// contact sheets for review
const sheetPage = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
for (const size of sizes) {
  const groups = new Map<string, Shot[]>();
  for (const s of shots) { const g = s.id.split('/')[0]; (groups.get(g) ?? groups.set(g, []).get(g)!).push(s); }
  for (const [g, list] of groups) {
    const tw = size.w > size.h ? 300 : 190;
    const html = `<body style="margin:0;background:#333;font:11px sans-serif;color:#eee">${list.map((s) =>
      `<div style="display:inline-block;margin:3px;width:${tw}px;vertical-align:top"><img src="${process.cwd()}/qa/screenshots/${size.name}/${s.file}" style="width:${tw}px;display:block">${s.id.split('/')[1]}${report[size.name][s.id] ? ' ⚠' : ''}</div>`).join('')}</body>`;
    writeFileSync('/tmp/claude-sheet.html', html.replaceAll(`src="${process.cwd()}`, `src="file://${process.cwd()}`));
    await sheetPage.goto('file:///tmp/claude-sheet.html');
    await sheetPage.waitForTimeout(300);
    mkdirSync('qa/sheets', { recursive: true });
    await sheetPage.screenshot({ path: `qa/sheets/${size.name}--${g}.png`, fullPage: true });
  }
}
await browser.close();
server.close();
mkdirSync('qa', { recursive: true });
writeFileSync('qa/screenshot-report.json', JSON.stringify({ sizes: sizes.map((s) => s.name), screenshots: shots.length, problems, report }, null, 2));
console.log(`\n${shots.length} scenes x ${sizes.length} sizes. ${problems} layout issue(s). Report: qa/screenshot-report.json`);
