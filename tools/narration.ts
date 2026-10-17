// Narration build steps (build time only).
//   node tools/narration.ts jobs       list every line x crew setup -> tools/tts/.work/jobs.json
//   node tools/narration.ts manifest   timings -> src/generated/narration.json, prune old clips
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Mission, NarrationManifest, NarrationClip } from '../src/story/types.ts';
import { CASTS, CAST_KEYS, renderLine } from '../src/story/template.ts';
import { missionLines, uiLines, type LineRef, type UiLine } from '../src/story/lines.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const VOICE = 'af_heart';
const RENDER_VERSION = 2; // bump to re-record everything after a pipeline change

export function loadMissions(): Mission[] {
  const dir = join(ROOT, 'content/missions');
  return readdirSync(dir).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Mission)
    .sort((a, b) => a.order - b.order);
}

export function allLineRefs(): LineRef[] {
  const ui = JSON.parse(readFileSync(join(ROOT, 'content/ui-lines.json'), 'utf8')) as UiLine[];
  return [...uiLines(ui), ...loadMissions().flatMap(missionLines)];
}

export const clipId = (text: string, speed: number) =>
  createHash('sha1').update(`${RENDER_VERSION}|${VOICE}|${speed}|${text}`).digest('hex').slice(0, 12);

function plan() {
  const lines: Record<string, Record<string, string>> = {};
  const jobs = new Map<string, { id: string; text: string; speed: number }>();
  for (const ref of allLineRefs()) {
    const per: Record<string, string> = {};
    for (const k of CAST_KEYS) {
      const text = renderLine(ref.tpl, CASTS[k]);
      const id = clipId(text, ref.speed);
      per[k] = id;
      jobs.set(id, { id, text, speed: ref.speed });
    }
    lines[ref.key] = per;
  }
  return { lines, jobs: [...jobs.values()] };
}

const cmd = process.argv[2];
if (cmd === 'jobs') {
  const { jobs } = plan();
  mkdirSync(join(ROOT, 'tools/tts/.work'), { recursive: true });
  writeFileSync(join(ROOT, 'tools/tts/.work/jobs.json'), JSON.stringify({ voice: VOICE, jobs }, null, 1));
  console.log(`${jobs.length} unique clips`);
} else if (cmd === 'manifest') {
  const { lines, jobs } = plan();
  const tPath = join(ROOT, 'content/generated/narration-timings.json');
  const timings: Record<string, NarrationClip> = existsSync(tPath) ? JSON.parse(readFileSync(tPath, 'utf8')) : {};
  const audioDir = join(ROOT, 'public/narration');
  const missing = jobs.filter((j) => !timings[j.id] || !existsSync(join(audioDir, `${j.id}.mp3`)));
  const used = new Set(jobs.map((j) => j.id));
  // keep the manifest small: one id when every crew setup sounds the same
  const compact: NarrationManifest['lines'] = {};
  for (const [key, per] of Object.entries(lines)) {
    const ids = new Set(Object.values(per));
    compact[key] = ids.size === 1 ? { '*': [...ids][0] } : per;
  }
  const clips: Record<string, NarrationClip> = {};
  for (const id of [...used].sort()) if (timings[id]) clips[id] = timings[id];
  mkdirSync(join(ROOT, 'src/generated'), { recursive: true });
  writeFileSync(join(ROOT, 'src/generated/narration.json'), JSON.stringify({ lines: compact, clips }));
  // prune clips no line uses any more
  let pruned = 0;
  if (existsSync(audioDir)) for (const f of readdirSync(audioDir)) {
    const id = f.replace(/\.mp3$/, '');
    if (f.endsWith('.mp3') && !used.has(id)) { unlinkSync(join(audioDir, f)); pruned++; }
  }
  const prunedTimings = Object.fromEntries(Object.entries(timings).filter(([id]) => used.has(id)));
  writeFileSync(tPath, JSON.stringify(prunedTimings, null, 0));
  const total = Object.values(clips).reduce((s, c) => s + c.d, 0);
  console.log(`manifest: ${Object.keys(compact).length} lines, ${Object.keys(clips).length} clips, ${(total / 60).toFixed(1)} min audio, pruned ${pruned}`);
  if (missing.length) { console.log(`MISSING ${missing.length} clips — run npm run narration`); process.exit(1); }
} else {
  console.log('usage: node tools/narration.ts jobs|manifest');
  process.exit(2);
}
