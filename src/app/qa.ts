// QA mode, for screenshots and automated checks. Reached only by a URL a
// grown-up types (#qa=...), so children never see it.
import { mission, MISSIONS } from './content.ts';
import { MissionPlayer } from './player.ts';
import { defaults, save, load } from './settings.ts';
import { flags } from './narrator.ts';
import { clock } from './clock.ts';
import { homeScreen, lightsOutScreen, showEnding, splashScreen, wallScreen, type Nav } from '../ui/screens.ts';
import { parentScreen } from '../ui/parent.ts';
import { resolveSticker } from '../art/stickers.ts';
import { App } from './app.ts';

export function qaParams(): URLSearchParams | null {
  const hash = location.hash.slice(1);
  if (!hash.startsWith('qa=') && !hash.startsWith('fast')) return null;
  return new URLSearchParams(hash);
}

export async function runQa(root: HTMLElement, q: URLSearchParams) {
  document.body.classList.add('qa');
  if (q.get('still') !== '0') document.body.classList.add('still');
  const s = defaults();
  s.crew = q.get('crew') === 'solo' ? 'solo' : 'two';
  s.soloWho = q.get('who') === 'T' ? 'T' : 'A';
  if (q.get('nameA')) s.names.A = q.get('nameA')!;
  if (q.get('nameT')) s.names.T = q.get('nameT')!;
  if (q.get('captions') === '0') s.captions = false;
  if (q.get('stickers') === 'all') for (const m of MISSIONS) s.stickers[m.id] = resolveSticker(m.sticker, m.state);
  if (q.get('lightsOut') === '1') s.lightsOut = true;
  save(s);
  const nav: Nav = { home() {}, play() {}, wall() {}, parent() {}, lightsOut() {} };
  const view = q.get('qa') ?? 'fast';
  const mount = (el: HTMLElement) => { root.innerHTML = ''; root.append(el); };

  if (view === 'fast' || q.has('fast')) {
    // automated play-through: narration skipped, taps auto-complete,
    // choices come from window.__ssPick(pageId)
    flags.fast = true;
    clock.fast = true;
    const app = new App(root);
    const m = mission(q.get('m') ?? '');
    if (m) { app.play(m); return; }
    app.start();
    return;
  }
  if (view === 'splash') return mount(splashScreen(() => {}));
  if (view === 'home') return mount(homeScreen(load(), nav, { greet: false }).el);
  if (view === 'wall') return mount(wallScreen(load(), nav).el);
  if (view === 'parent') return mount(parentScreen(() => {}).el);
  if (view === 'lightsout') return mount(lightsOutScreen(load(), nav, { speak: false }).el);
  const m = mission(q.get('m') ?? '') ?? MISSIONS[0];
  const p = new MissionPlayer(m, load(), { onExit() {}, onFinished() {} });
  mount(p.el);
  const state = JSON.parse(q.get('state') ?? '{}');
  if (view === 'ending') {
    flags.fast = true;
    const endPage = Object.keys(m.pages).find((k) => m.pages[k].end) ?? m.start;
    await p.preview(endPage, 'none', state);
    const sticker = resolveSticker(m.sticker, { ...m.state, ...state });
    await showEnding(p.el, m, sticker, load(), nav, { cancelled: false });
    return;
  }
  if (view === 'title') { await p.preview(m.start, 'title', state); return; }
  await p.preview(q.get('p') ?? m.start, q.get('b') ?? '0', state);
}
