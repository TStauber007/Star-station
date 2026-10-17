// Finishes the claude.ai test build (npm run build:claude) in dist-claude/:
//  - joins the 896 narration clips into packs (that host caps a page's file
//    count), grouped by which missions and crew setups use each clip, so a
//    mission only downloads the packs it needs;
//  - writes the page as the host expects it: no <html>/<head>/<body> tags,
//    because the host adds its own wrapper;
//  - writes preview.html, the same page in a stand-in wrapper, for local tests;
//  - prints the list of files to publish.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const OUT = 'dist-claude';
const manifest = JSON.parse(readFileSync('src/generated/narration.json', 'utf8')) as {
  lines: Record<string, Record<string, string>>;
};

// Which missions and crew setups use each clip.
const use = new Map<string, { m: Set<string>; c: Set<string> }>();
for (const [key, per] of Object.entries(manifest.lines)) {
  const mission = key.split(':')[0];
  for (const [cast, id] of Object.entries(per)) {
    const u = use.get(id) ?? { m: new Set(), c: new Set() };
    u.m.add(mission); u.c.add(cast); use.set(id, u);
  }
}
const groups = new Map<string, string[]>();
for (const [id, u] of use) {
  const sig = `${[...u.m].sort().join('+')}|${[...u.c].sort().join(',')}`;
  groups.set(sig, [...(groups.get(sig) ?? []), id]);
}

rmSync(join(OUT, 'narration'), { recursive: true, force: true });
rmSync(join(OUT, 'narration-packs'), { recursive: true, force: true });
mkdirSync(join(OUT, 'narration-packs'), { recursive: true });

const packs: string[] = [];
const clips: Record<string, [number, number, number]> = {};
let total = 0;
[...groups.keys()].sort().forEach((sig, n) => {
  const parts: Buffer[] = [];
  let offset = 0;
  for (const id of groups.get(sig)!.sort()) {
    const b = readFileSync(join('public/narration', `${id}.mp3`));
    clips[id] = [n, offset, b.length];
    parts.push(b); offset += b.length;
  }
  const name = `p${String(n).padStart(3, '0')}.mp3`;
  writeFileSync(join(OUT, 'narration-packs', name), Buffer.concat(parts));
  packs.push(name); total += offset;
});
writeFileSync(join(OUT, 'narration-packs', 'index.json'), JSON.stringify({ packs, clips }));

// The page: keep the title, the app's own script and stylesheet, and the app root.
const html = readFileSync(join(OUT, 'index.html'), 'utf8');
const script = html.match(/<script type="module"[^>]*><\/script>/)?.[0];
const style = html.match(/<link rel="stylesheet"[^>]*>/)?.[0];
if (!script || !style) throw new Error('could not find the built script and stylesheet in index.html');
const page = [
  '<title>Star Station</title>',
  '<meta name="theme-color" content="#1b1f45">',
  '<meta name="referrer" content="no-referrer">',
  // The host wrapper sets a 14px body font; the app was laid out at the usual 16px.
  '<style>body{font-size:16px}</style>',
  style,
  script,
  '<div id="app"></div>',
  '<noscript>Star Station needs JavaScript turned on.</noscript>',
  '',
].join('\n');
writeFileSync(join(OUT, 'index.html'), page);
writeFileSync(join(OUT, 'preview.html'), [
  '<!doctype html><html lang="en"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>',
  '</head><body>', page, '</body></html>',
].join('\n'));

// Only what the page uses: no icons, manifest or service worker.
for (const f of ['manifest.webmanifest', 'sw.js']) rmSync(join(OUT, f), { force: true });
rmSync(join(OUT, 'icons'), { recursive: true, force: true });

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(OUT).map((p) => relative(OUT, p)).filter((f) => f !== 'index.html' && f !== 'preview.html').sort();
writeFileSync(join(OUT, 'files.json'), JSON.stringify(files, null, 1));
const size = files.reduce((s, f) => s + statSync(join(OUT, f)).size, 0);
console.log(`${Object.keys(clips).length} clips in ${packs.length} packs (${(total / 1e6).toFixed(1)} MB)`);
console.log(`${files.length} files to publish besides the page, ${(size / 1e6).toFixed(1)} MB in all`);
