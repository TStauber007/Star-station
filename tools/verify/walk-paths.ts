// Walks every branch of every mission.
//   node tools/verify/walk-paths.ts           story data + narration audio, every crew setup
//   node tools/verify/walk-paths.ts --engine  also plays every path in the built app (fast mode)
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import type { Mission, NarrationManifest } from '../../src/story/types.ts';
import { allPaths } from '../../src/story/paths.ts';
import { CASTS, CAST_KEYS, renderLine } from '../../src/story/template.ts';
import { beatKey, choiceKey, optionKey, titleKey, uiKey } from '../../src/story/lines.ts';

const missions = readdirSync('content/missions').map((f) => JSON.parse(readFileSync('content/missions/' + f, 'utf8')) as Mission).sort((a, b) => a.order - b.order);
const manifest = JSON.parse(readFileSync('src/generated/narration.json', 'utf8')) as NarrationManifest;
const ui = JSON.parse(readFileSync('content/ui-lines.json', 'utf8')) as { id: string; say: string }[];
const problems: string[] = [];
const checkedClips = new Set<string>();
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

function checkLine(key: string, tpl: string, cast: string, where: string) {
  const per = manifest.lines[key];
  const id = per?.[cast] ?? per?.['*'];
  if (!id) { problems.push(`${where}: no narration for ${key} (${cast})`); return; }
  const clip = manifest.clips[id];
  if (!clip) { problems.push(`${where}: no timings for clip ${id}`); return; }
  const file = `public/narration/${id}.mp3`;
  if (!checkedClips.has(id)) {
    checkedClips.add(id);
    if (!existsSync(file) || statSync(file).size < 1500) problems.push(`${where}: audio file missing or empty ${file}`);
    if (!(clip.d > 0.3) || clip.w.length === 0) problems.push(`${where}: clip ${id} has no words or no length`);
    let last = 0;
    for (const [s, e] of clip.w) { if (s < last - 0.05 || e < s || e > clip.d + 0.01) { problems.push(`${where}: clip ${id} word timings out of order`); break; } last = s; }
  }
  const spoken = norm(clip.w.map((w) => w[2]).join(' '));
  const expected = norm(renderLine(tpl, CASTS[cast as keyof typeof CASTS]));
  if (spoken !== expected) problems.push(`${where}: ${key} (${cast}) audio says "${spoken}" but the script says "${expected}"`);
}

let pathCount = 0;
const report: Record<string, { paths: number; pages: number; ends: string[]; minutes?: [number, number] }> = {};
const clipLen = (key: string) => { const per = manifest.lines[key]; const id = per?.NN ?? per?.['*']; return id ? manifest.clips[id]?.d ?? 0 : 0; };
for (const m of missions) {
  let paths;
  try { paths = allPaths(m); } catch (e) { problems.push(`${m.id}: ${(e as Error).message}`); continue; }
  const reached = new Set(paths.flatMap((p) => p.steps.map((s) => s.pageId)));
  for (const pid of Object.keys(m.pages)) if (!reached.has(pid)) problems.push(`${m.id}: page ${pid} unreachable`);
  for (const p of paths) {
    pathCount++;
    const label = `${m.id} [${p.steps.map((s) => s.pageId).join('>')}]`;
    if (!m.pages[p.endPage]?.end) problems.push(`${label}: does not end on an ending page`);
    for (const cast of CAST_KEYS) {
      checkLine(titleKey(m), m.titleSay, cast, label);
      for (const st of p.steps) {
        const page = m.pages[st.pageId];
        for (const b of st.beats) checkLine(beatKey(m, st.pageId, page.beats.indexOf(b)), b.say, cast, label);
        if (page.choice) {
          checkLine(choiceKey(m, st.pageId), page.choice.say, cast, label);
          page.choice.options.forEach((o, i) => checkLine(optionKey(m, st.pageId, i), o.say, cast, label));
        }
      }
    }
  }
  // real running time: recorded narration + the app's pauses + time to tap, choose and turn pages
  const gap = m.mood === 'bedtime' ? 1.0 : 0.65;
  const mins = paths.map((p) => {
    let t = 1.5 + clipLen(titleKey(m)) + 0.7;
    for (const st of p.steps) {
      const page = m.pages[st.pageId];
      t += 0.55 + 0.65; // page fade + settle
      for (const b of st.beats) {
        t += clipLen(beatKey(m, st.pageId, page.beats.indexOf(b))) + gap;
        if (b.tap) t += b.tap.count * 1.1 + 0.7;
        if (b.do) t += 4;
      }
      if (page.choice) t += clipLen(choiceKey(m, st.pageId)) + clipLen(optionKey(m, st.pageId, 0)) + clipLen(optionKey(m, st.pageId, 1)) + 0.5 + 5 + 0.9;
      else if (page.next) t += 2.5;
    }
    t += 12; // the calm ending screen
    return t / 60;
  });
  const range: [number, number] = [Math.round(Math.min(...mins) * 10) / 10, Math.round(Math.max(...mins) * 10) / 10];
  console.log(`  ${m.title}: ${paths.length} paths, about ${range[0]}–${range[1]} minutes`);
  report[m.id] = { paths: paths.length, pages: Object.keys(m.pages).length, ends: [...new Set(paths.map((p) => p.endPage))], minutes: range };
}
for (const l of ui) for (const cast of CAST_KEYS) checkLine(uiKey(l.id), l.say, cast, 'ui');

console.log(`${missions.length} missions, ${pathCount} paths, ${CAST_KEYS.length} crew setups, ${checkedClips.size} audio clips checked.`);

// ------------------------------------------------------------------ engine run
let engine: { runs: number; ok: number; failures: string[] } | null = null;
if (process.argv.includes('--engine')) {
  const { chromium } = await import('@playwright/test');
  const { serveDist } = await import('./serve.ts');
  const { url, server } = await serveDist();
  const browser = await chromium.launch();
  const casts = [
    { name: 'two named', q: '' },
    { name: 'solo Tommy', q: '&crew=solo&who=T' },
    { name: 'two renamed', q: '&nameA=Lily&nameT=Max' },
  ];
  engine = { runs: 0, ok: 0, failures: [] };
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  for (const m of missions) {
    for (const p of allPaths(m)) {
      for (const c of casts) {
        engine.runs++;
        errors.length = 0;
        const plan: Record<string, number> = {};
        for (const st of p.steps) if (st.chose !== undefined) plan[st.pageId] = st.chose;
        await page.goto('about:blank');
        await page.addInitScript((pl) => { (window as any).__ssPick = (pid: string) => pl[pid] ?? 0; }, plan);
        await page.goto(`${url}/?r=${Math.random()}#fast&qa=fast&m=${m.id}${c.q}`);
        const want = p.steps.map((s) => s.pageId);
        try {
          await page.waitForFunction(() => window.__ss?.phase === 'end', null, { timeout: 60000, polling: 100 });
          const got = await page.evaluate(() => window.__ss!.path);
          if (JSON.stringify(got) !== JSON.stringify(want)) engine.failures.push(`${m.id} (${c.name}): went ${got.join('>')} instead of ${want.join('>')}`);
          else if (errors.length) engine.failures.push(`${m.id} (${c.name}) ${want.join('>')}: ${errors.join('; ')}`);
          else engine.ok++;
        } catch {
          const probe = await page.evaluate(() => window.__ss);
          engine.failures.push(`${m.id} (${c.name}) ${want.join('>')}: stuck at ${probe?.page} beat ${probe?.beat} (${probe?.phase}) ${errors.join('; ')}`);
        }
      }
    }
    console.log(`  engine: ${m.id} done (${engine.ok}/${engine.runs} ok so far)`);
  }
  await browser.close();
  server.close();
  console.log(`Engine play-through: ${engine.ok}/${engine.runs} runs reached their ending.`);
  problems.push(...engine.failures);
}

mkdirSync('qa', { recursive: true });
writeFileSync('qa/paths-report.json', JSON.stringify({ missions: report, paths: pathCount, casts: CAST_KEYS, clips: checkedClips.size, engine, problems }, null, 2));
for (const p of problems.slice(0, 60)) console.log('PROBLEM:', p);
if (problems.length) { console.log(`${problems.length} problem(s).`); process.exit(1); }
console.log('Every path reaches its ending, every line has matching audio, nothing dead-ends.');
