import { defineConfig, type Plugin } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// Content Security Policy for the built app: nothing may load from, or talk
// to, anywhere but the app's own files. (Dev mode skips it so Vite can work.)
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
].join('; ');

function csp(): Plugin {
  return {
    name: 'star-station-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// A small service worker that keeps every file of the app on the tablet,
// so it runs with no network at all once installed.
function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'star-station-sw',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    writeBundle() {
      const files = walk(outDir)
        .map((p) => relative(outDir, p).split('\\').join('/'))
        .filter((f) => f !== 'sw.js' && !f.endsWith('.map'));
      const hash = createHash('sha1');
      for (const f of files.sort()) hash.update(f).update(readFileSync(join(outDir, f)));
      const version = hash.digest('hex').slice(0, 10);
      const sw = readFileSync('src/sw-template.js', 'utf8')
        .replace('__VERSION__', version)
        .replace('__FILES__', JSON.stringify(['./', ...files.map((f) => `./${f}`)]));
      writeFileSync(join(outDir, 'sw.js'), sw);
      console.log(`service worker: ${files.length} files, version ${version}`);
    },
  };
}

// `--mode claude` is the claude.ai test build (npm run build:claude). That
// host has its own security policy and allows no service worker, so both
// plugins are left out, and the fonts are inlined into the stylesheet.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'claude' ? [] : [csp(), serviceWorker()],
  build: {
    target: 'es2020',
    assetsInlineLimit: mode === 'claude' ? 1_000_000 : 0,
    chunkSizeWarningLimit: 900,
  },
  server: { host: true },
  preview: { host: true },
}));
