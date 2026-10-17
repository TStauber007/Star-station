// Story checker: format, templates, reachability, paths, Tommy moments, timing.
//   node tools/check-story.ts            check everything
//   node tools/check-story.ts --print    also print every variant of every line
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Mission } from '../src/story/types.ts';
import { allPaths, PathError } from '../src/story/paths.ts';
import { CASTS, CAST_KEYS, renderLine, templateProblems } from '../src/story/template.ts';
import { missionLines, missionSpeed, uiLines, type UiLine } from '../src/story/lines.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const print = process.argv.includes('--print');
const errors: string[] = [];
const warnings: string[] = [];

let vocab: Record<string, string[]> | null = null;
const vocabPath = join(ROOT, 'src/art/vocab.json');
if (existsSync(vocabPath)) vocab = JSON.parse(readFileSync(vocabPath, 'utf8'));

export function loadMissions(): Mission[] {
  const dir = join(ROOT, 'content/missions');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Mission)
    .sort((a, b) => a.order - b.order);
}

function checkArt(where: string, art: Record<string, unknown> | undefined, state: Record<string, string>) {
  if (!art || !vocab) return;
  const sub = (v: string) => v.replace(/\$(\w+)/g, (_m, k) => state[k] ?? `$${k}`);
  for (const [k, v] of Object.entries(art)) {
    const allowed = vocab[k];
    if (!allowed) { errors.push(`${where}: unknown art field "${k}"`); continue; }
    const values = Array.isArray(v) ? v : [v];
    for (const raw of values as string[]) {
      // check every value a $variable could take
      const vars = [...raw.matchAll(/\$(\w+)/g)].map((m) => m[1]);
      const variants = vars.length ? expandVars(raw, vars) : [raw];
      for (const val of variants) if (!allowed.includes(sub(val))) errors.push(`${where}: unknown ${k} "${val}"`);
    }
  }
}

let varValues: Record<string, Set<string>> = {};
function expandVars(raw: string, vars: string[]): string[] {
  let out = [raw];
  for (const v of vars) {
    const vals = [...(varValues[v] ?? [])];
    if (!vals.length) { errors.push(`unknown $${v} in "${raw}"`); return []; }
    out = out.flatMap((s) => vals.map((x) => s.replace(`$${v}`, x)));
  }
  return out;
}

const missions = loadMissions();
const ids = new Set<string>();
const report: string[] = [];

for (const m of missions) {
  const W = (s: string) => `${m.id}: ${s}`;
  if (ids.has(m.id)) errors.push(W('duplicate mission id'));
  ids.add(m.id);
  for (const f of ['id', 'order', 'title', 'titleSay', 'sticker', 'start', 'pages', 'parent', 'state', 'cover'] as const) {
    if ((m as any)[f] === undefined) errors.push(W(`missing "${f}"`));
  }
  const p = m.parent;
  if (p && (!p.virtue || !p.summary || !p.science?.length || !p.paths?.length || (p.talk?.length ?? 0) < 2)) {
    errors.push(W('parent notes need virtue, summary, science, paths and at least 2 talk questions'));
  }

  // values each state variable can take
  varValues = {};
  for (const [k, v] of Object.entries(m.state ?? {})) (varValues[k] ??= new Set()).add(v);
  for (const page of Object.values(m.pages)) for (const o of page.choice?.options ?? [])
    for (const [k, v] of Object.entries(o.set ?? {})) (varValues[k] ??= new Set()).add(v);

  // page shape
  let choices = 0;
  for (const [pid, page] of Object.entries(m.pages)) {
    const ends = [page.next !== undefined, page.choice !== undefined, page.end === true].filter(Boolean).length;
    if (ends !== 1) errors.push(W(`page ${pid} needs exactly one of next / choice / end`));
    if (!page.art) errors.push(W(`page ${pid} has no art`));
    if (!Array.isArray(page.beats) || page.beats.length === 0) errors.push(W(`page ${pid} has no beats`));
    if (page.choice) {
      choices++;
      if (page.choice.options.length !== 2) errors.push(W(`page ${pid}: a choice needs exactly two picture cards`));
      for (const o of page.choice.options) {
        if (!o.card || !o.label || !o.say || !o.next) errors.push(W(`page ${pid}: option needs card, label, say, next`));
        if (!m.pages[o.next]) errors.push(W(`page ${pid}: option goes to missing page "${o.next}"`));
        if (vocab && !vocab.card.includes(o.card)) errors.push(W(`page ${pid}: unknown card "${o.card}"`));
      }
    }
    if (page.next && !m.pages[page.next]) errors.push(W(`page ${pid}: next is missing page "${page.next}"`));
    page.beats.forEach((b, i) => {
      if (!b.say) errors.push(W(`page ${pid} beat ${i} has no line`));
      if (b.tap && (!b.tap.effect || !(b.tap.count >= 1))) errors.push(W(`page ${pid} beat ${i}: tap needs effect and count`));
      if (b.tap && vocab && !vocab.tap.includes(b.tap.effect)) errors.push(W(`page ${pid} beat ${i}: unknown tap effect "${b.tap.effect}"`));
      if (b.do && vocab && !vocab.targets.includes(b.do.targets)) errors.push(W(`page ${pid} beat ${i}: unknown targets "${b.do.targets}"`));
      if (b.sfx && vocab && !vocab.sfx.includes(b.sfx)) errors.push(W(`page ${pid} beat ${i}: unknown sfx "${b.sfx}"`));
      if (b.if) for (const [k, v] of Object.entries(b.if)) if (!varValues[k]?.has(v)) errors.push(W(`page ${pid} beat ${i}: "if" ${k}=${v} can never be true`));
    });
  }
  if (choices < 3 || choices > 4) warnings.push(W(`has ${choices} choice points (aim for 3–4)`));

  // templates
  for (const l of missionLines(m)) for (const prob of templateProblems(l.tpl)) errors.push(W(`${l.key}: ${prob}`));

  // paths
  let paths;
  try { paths = allPaths(m); } catch (e) { errors.push(W((e as PathError).message)); continue; }
  const visited = new Set(paths.flatMap((pa) => pa.steps.map((s) => s.pageId)));
  for (const pid of Object.keys(m.pages)) if (!visited.has(pid)) errors.push(W(`page ${pid} can never be reached`));

  const stats = paths.map((pa) => {
    let words = 0, taps = 0, dos = 0, chosen = 0, lines = 1, pages = pa.steps.length;
    let stretchHasTap = false; const stretchProblems: string[] = [];
    let state = { ...m.state };
    for (const st of pa.steps) {
      const page = m.pages[st.pageId];
      checkArt(`${m.id}/${st.pageId}`, page.art as any, state);
      for (const b of st.beats) {
        words += renderLine(b.say, CASTS.NN).split(/\s+/).length; lines++;
        if (b.tap) { taps++; stretchHasTap = true; }
        if (b.do) dos++;
        checkArt(`${m.id}/${st.pageId}`, b.art as any, state);
      }
      if (st.chose !== undefined) {
        const opt = page.choice!.options[st.chose];
        words += renderLine(page.choice!.say, CASTS.NN).split(/\s+/).length;
        for (const o of page.choice!.options) { words += o.say.split(/\s+/).length; lines++; }
        lines++;
        if (!stretchHasTap) stretchProblems.push(`before the choice on ${st.pageId}`);
        stretchHasTap = false; chosen++;
        state = { ...state, ...(opt.set ?? {}) };
      }
    }
    if (!stretchHasTap) stretchProblems.push('after the last choice');
    // read-aloud ≈ 140 words/min at our speed, + pauses between lines, taps, choices, page turns
    const secs = (words / 140) * 60 / (missionSpeed(m) / 0.82) + lines * 0.8 + taps * 7 + dos * 6 + chosen * 8 + pages * 2.5;
    return { words, taps, dos, chosen, pages, secs, stretchProblems, path: pa };
  });
  for (const s of stats) for (const sp of s.stretchProblems)
    errors.push(W(`no Tommy "tap anything" moment ${sp} (path ${s.path.steps.map((x) => x.pageId).join('>')})`));
  const mins = stats.map((s) => s.secs / 60);
  const lo = Math.min(...mins), hi = Math.max(...mins);
  if (lo < 6 || hi > 10) warnings.push(W(`estimated ${lo.toFixed(1)}–${hi.toFixed(1)} min (aim 6–10)`));
  report.push(`${m.order}. ${m.title.padEnd(24)} ${String(paths.length).padStart(3)} paths  ${choices} choices  ` +
    `${Math.min(...stats.map((s) => s.words))}–${Math.max(...stats.map((s) => s.words))} words  ~${lo.toFixed(1)}–${hi.toFixed(1)} min  ` +
    `taps ${Math.min(...stats.map((s) => s.taps))}–${Math.max(...stats.map((s) => s.taps))}  hands-on ${Math.min(...stats.map((s) => s.dos))}–${Math.max(...stats.map((s) => s.dos))}`);
}

const ui = JSON.parse(readFileSync(join(ROOT, 'content/ui-lines.json'), 'utf8')) as UiLine[];
for (const l of uiLines(ui)) for (const prob of templateProblems(l.tpl)) errors.push(`${l.key}: ${prob}`);

if (print) {
  for (const m of missions) {
    console.log(`\n=== ${m.order}. ${m.title}`);
    for (const l of missionLines(m)) {
      const seen = new Map<string, string[]>();
      for (const k of CAST_KEYS) { const t = renderLine(l.tpl, CASTS[k]); seen.set(t, [...(seen.get(t) ?? []), k]); }
      for (const [t, ks] of seen) console.log(`${l.key.padEnd(34)} ${seen.size > 1 ? ks.join(',').padEnd(12) : ''.padEnd(12)} ${t}`);
    }
  }
}

console.log(report.join('\n'));
for (const w of warnings) console.log('warning:', w);
for (const e of errors) console.log('ERROR:', e);
if (errors.length) { console.log(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`\nStory check passed: ${missions.length} missions.`);
