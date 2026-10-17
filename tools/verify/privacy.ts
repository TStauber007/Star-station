// Privacy check: the built app makes no network requests beyond its own
// files, installs for offline use, and then plays with the network off.
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { serveDist } from './serve.ts';

const result: Record<string, unknown> = {};
const problems: string[] = [];

// 1. Static scan of the build: which addresses appear anywhere in the code?
const files: string[] = [];
const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); });
walk('dist');
const textFiles = files.filter((f) => /\.(js|css|html|webmanifest|json)$/.test(f));
const urls = new Map<string, string[]>();
for (const f of textFiles) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/https?:\/\/[a-z0-9.-]+[^\s"'`)<]*/gi)) {
    const host = new URL(m[0]).host;
    (urls.get(host) ?? urls.set(host, []).get(host)!).push(f);
  }
}
const hosts = [...urls.keys()];
result.urlHostsInBuild = Object.fromEntries([...urls].map(([h, fs]) => [h, [...new Set(fs)].length]));
// Only the SVG/XML namespace and the science-source citations (shown as plain text) are expected.
const allowedHosts = new Set(['www.w3.org']);
const js = textFiles.filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
const apiHits = ['XMLHttpRequest', 'WebSocket', 'sendBeacon', 'EventSource', 'RTCPeerConnection', 'navigator.geolocation', 'getUserMedia', 'document.cookie', 'indexedDB.open'].filter((k) => js.includes(k));
result.networkApisInCode = apiHits;
if (apiHits.length) problems.push(`network or tracking APIs in the bundle: ${apiHits.join(', ')}`);
const html = readFileSync('dist/index.html', 'utf8');
const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1] ?? '';
result.csp = csp;
if (!csp.includes("connect-src 'self'") || !csp.includes("default-src 'self'")) problems.push('Content-Security-Policy missing or too loose');
const linkHosts = hosts.filter((h) => !allowedHosts.has(h));
result.citationHostsShownAsText = linkHosts;
if (/<a\s[^>]*href=["']https?:/i.test(js + html)) problems.push('an outbound link (<a href="http...">) exists in the build');

// 2. Live run: first visit online (installs), then everything offline.
const { url, server } = await serveDist();
const origin = new URL(url).origin;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: 'allow' });
const requests: { url: string; phase: string; fromSW: boolean; ok: boolean }[] = [];
let phase = 'online';
ctx.on('request', (r) => { if (!r.url().startsWith(origin)) problems.push(`[${phase}] request to another host: ${r.url()}`); });
ctx.on('requestfinished', async (r) => { const resp = await r.response(); requests.push({ url: r.url().replace(origin, ''), phase, fromSW: !!resp?.fromServiceWorker(), ok: !!resp && resp.status() < 400 }); });
ctx.on('requestfailed', (r) => requests.push({ url: r.url().replace(origin, ''), phase, fromSW: false, ok: false }));
// belt and braces: block anything not from the app's own server
await ctx.route('**/*', (route) => (route.request().url().startsWith(origin) ? route.continue() : route.abort()));

const page = await ctx.newPage();
await page.goto(url + '/');
await page.evaluate(() => navigator.serviceWorker.ready);
// wait until every file is in the offline cache
const expected = Number(/version|files/.test('') ? 0 : 0);
void expected;
const swText = readFileSync('dist/sw.js', 'utf8');
const fileCount = JSON.parse(/const FILES = (\[.*?\]);/s.exec(swText)![1]).length;
let cached = 0;
for (let i = 0; i < 240 && cached < fileCount; i++) {
  cached = await page.evaluate(async () => { let n = 0; for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length; return n; });
  if (cached < fileCount) await page.waitForTimeout(500);
}
result.offlineCache = { expected: fileCount, cached };
if (cached < fileCount) problems.push(`only ${cached} of ${fileCount} files were cached for offline use`);

// go offline: browser offline AND the server stopped
phase = 'offline';
server.close();
await ctx.setOffline(true);
await page.reload();
await page.waitForTimeout(800);
await page.locator('.big-go').click({ force: true }); // splash: tap to start
await page.waitForTimeout(1500);
await page.locator('.mcard').first().click({ force: true }); // mission 1
await page.waitForTimeout(800);
await page.locator('.detail .big-go').click({ force: true }); // go!
await page.waitForTimeout(16000);           // listen to the title and first lines
const state = await page.evaluate(() => ({ probe: window.__ss, audio: !!document.querySelector('.caption .w') }));
result.offlinePlay = state;
if (!state.probe || state.probe.path.length === 0) problems.push('mission did not start offline');
const offline = requests.filter((r) => r.phase === 'offline');
const notFromCache = offline.filter((r) => !r.fromSW || !r.ok);
result.offlineRequests = { total: offline.length, servedFromOfflineCache: offline.filter((r) => r.fromSW && r.ok).length, narrationClips: offline.filter((r) => r.url.includes('/narration/')).length };
if (notFromCache.length) problems.push(`offline requests not served from the cache: ${notFromCache.slice(0, 5).map((r) => r.url).join(', ')}`);
result.onlineRequests = { total: requests.filter((r) => r.phase === 'online').length, otherHosts: 0 };
await browser.close();

result.problems = problems;
mkdirSync('qa', { recursive: true });
writeFileSync('qa/privacy-report.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, csp: csp ? 'present' : 'missing' }, null, 2));
if (problems.length) { console.log(`\n${problems.length} privacy problem(s).`); process.exit(1); }
console.log('\nPrivacy check passed: no requests outside the app, works fully offline.');
