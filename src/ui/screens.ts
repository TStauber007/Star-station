// Splash, home, ending, sticker wall, lights out.
import type { Mission } from '../story/types.ts';
import { titleKey, uiKey } from '../story/lines.ts';
import { composeScene } from '../art/compose.ts';
import { sceneToSvg } from '../art/flat.ts';
import { robotSvg } from '../art/robot.ts';
import { stickerSvg, STICKER_NAMES } from '../art/stickers.ts';
import { Stage } from './stage.ts';
import { Caption } from './caption.ts';
import { h, holdButton } from './dom.ts';
import { icon } from './icons.ts';
import { Narrator } from '../app/narrator.ts';
import { castKey, type Settings } from '../app/settings.ts';
import { MISSIONS } from '../app/content.ts';
import { music } from '../audio/music.ts';
import { playSfx } from '../audio/sfx.ts';
import { clock } from '../app/clock.ts';

export interface Nav {
  home(): void;
  play(m: Mission): void;
  wall(): void;
  parent(): void;
  lightsOut(): void;
}

function grownUpButton(nav: Nav, label = 'Grown-ups: hold'): HTMLElement {
  const b = h('button', { class: 'grownup hold', 'aria-label': 'Grown-ups: press and hold for 3 seconds' },
    h('span', { class: 'ring' }), h('span', { html: icon('grown') }), h('span', { class: 'grownup-label' }, label));
  holdButton(b, 3000, () => nav.parent());
  return b;
}

function stageCtx(s: Settings, bedtime = false) {
  return { avatars: s.avatars, crew: s.crew, soloWho: s.soloWho, bedtime };
}

export function coverSvg(m: Mission, s: Settings, aspect = 1.45): string {
  const W = 1000 * aspect;
  return sceneToSvg(composeScene(m.cover, { W, state: { ...m.state }, ...stageCtx(s, m.mood === 'bedtime') }), W);
}

// ------------------------------------------------------------------ splash
export function splashScreen(onStart: () => void): HTMLElement {
  const go = h('button', { class: 'big-go', 'aria-label': 'Start' }, h('span', { html: icon('play') }));
  const el = h('div', { class: 'screen splash' },
    h('div', { class: 'splash-bot', html: robotSvg('wave') }),
    h('h1', { class: 'logo' }, 'Star Station'),
    go);
  go.addEventListener('click', onStart, { once: true });
  return el;
}

// ------------------------------------------------------------------ home
export function homeScreen(s: Settings, nav: Nav, opts: { greet: boolean }): { el: HTMLElement; destroy(): void } {
  const stage = new Stage();
  const caption = new Caption();
  caption.setVisible(s.captions);
  const narrator = new Narrator(caption);
  narrator.cast = castKey(s);
  const grid = h('div', { class: 'missions' });
  const detail = h('div', { class: 'detail hidden' });
  const el = h('div', { class: 'screen home' }, stage.el,
    h('header', { class: 'home-head' }, h('h1', { class: 'logo' }, 'Star Station')),
    grid, caption.el, detail,
    h('div', { class: 'home-foot' },
      (() => { const b = h('button', { class: 'pill wall-btn', 'aria-label': 'Station wall' }, h('span', { html: icon('wall') }), h('span', {}, 'Station wall')); b.addEventListener('click', () => { narrator.stop(); nav.wall(); }); return b; })(),
      grownUpButton(nav)));
  requestAnimationFrame(() => stage.show({ place: 'orbit', time: 'day', lights: 'on' }, {}, stageCtx(s), { instant: true }));
  music.set('home');

  for (const m of MISSIONS) {
    const sticker = s.stickers[m.id];
    const card = h('button', { class: `mcard${m.mood === 'bedtime' ? ' bedtime' : ''}`, 'aria-label': `Mission ${m.order}: ${m.title}` },
      h('div', { class: 'mcard-art', html: coverSvg(m, s) }),
      h('div', { class: 'mcard-num' }, String(m.order)),
      h('div', { class: 'mcard-title' }, m.title),
      sticker ? h('div', { class: 'mcard-sticker', html: stickerSvg(sticker) }) : null);
    card.addEventListener('click', () => openDetail(m));
    grid.append(card);
  }

  function openDetail(m: Mission) {
    playSfx('select');
    detail.innerHTML = '';
    const go = h('button', { class: 'big-go', 'aria-label': `Start ${m.title}` }, h('span', { html: icon('go') }));
    const close = h('button', { class: 'ctl close', 'aria-label': 'Back', html: icon('close') });
    const panel = h('div', { class: 'detail-panel' },
      h('div', { class: 'detail-art', html: coverSvg(m, s, 1.6) }),
      h('div', { class: 'detail-title' }, h('span', { class: 'detail-num' }, `Mission ${m.order}`), m.title),
      go);
    detail.append(panel, close);
    detail.classList.remove('hidden');
    requestAnimationFrame(() => detail.classList.add('open'));
    void narrator.say(titleKey(m));
    go.addEventListener('click', () => { narrator.stop(); nav.play(m); }, { once: true });
    const shut = () => { narrator.stop(); caption.hide(); detail.classList.remove('open'); setTimeout(() => detail.classList.add('hidden'), 300); };
    close.addEventListener('click', shut);
    detail.addEventListener('click', (e) => { if (e.target === detail) shut(); });
  }

  if (opts.greet) setTimeout(() => void narrator.say(uiKey('home')).then(() => caption.hide()), 700);
  return { el, destroy: () => narrator.stop() };
}

// ------------------------------------------------------------------ ending
export async function showEnding(host: HTMLElement, m: Mission, sticker: string, s: Settings, nav: Nav, signal: { cancelled: boolean }) {
  const caption = new Caption();
  caption.setVisible(s.captions);
  const narrator = new Narrator(caption);
  narrator.cast = castKey(s);
  const bedtime = m.mood === 'bedtime';
  const stickerEl = h('div', { class: 'end-sticker hidden', html: stickerSvg(sticker) });
  const buttons = h('div', { class: 'end-buttons hidden' });
  const el = h('div', { class: `ending${bedtime ? ' bedtime' : ''}` },
    h('div', { class: 'end-title' }, 'The End'), stickerEl, h('div', { class: 'end-sticker-name' }, STICKER_NAMES[sticker] ?? ''), buttons, caption.el);
  host.append(el);
  requestAnimationFrame(() => el.classList.add('open'));
  music.set(bedtime ? 'bedtime' : 'home');
  await clock.wait(600, signal);
  await narrator.say(uiKey('the-end'));
  if (signal.cancelled) return;
  await clock.wait(500, signal);
  stickerEl.classList.remove('hidden');
  playSfx('sticker');
  await narrator.say(uiKey('sticker'));
  if (bedtime) { await clock.wait(600, signal); await narrator.say(uiKey('bedtime-end')); }
  caption.hide();
  if (signal.cancelled) return;
  if (s.lightsOut) {
    const night = h('button', { class: 'pill big', 'aria-label': 'Lights out' }, h('span', { html: icon('moon') }), h('span', {}, 'Lights out'));
    night.addEventListener('click', () => nav.lightsOut());
    buttons.append(night);
  } else {
    const wall = h('button', { class: 'pill big', 'aria-label': 'Station wall' }, h('span', { html: icon('wall') }), h('span', {}, 'Station wall'));
    wall.addEventListener('click', () => nav.wall());
    const home = h('button', { class: 'pill big', 'aria-label': 'Home' }, h('span', { html: icon('home') }), h('span', {}, 'Home'));
    home.addEventListener('click', () => nav.home());
    buttons.append(wall, home);
  }
  buttons.classList.remove('hidden');
}

// ------------------------------------------------------------------ sticker wall
export function wallScreen(s: Settings, nav: Nav): { el: HTMLElement; destroy(): void } {
  const caption = new Caption();
  caption.setVisible(s.captions);
  const narrator = new Narrator(caption);
  narrator.cast = castKey(s);
  const slots = h('div', { class: 'wall-slots' });
  for (const m of MISSIONS) {
    const st = s.stickers[m.id];
    slots.append(h('div', { class: `slot${st ? ' filled' : ''}` },
      st ? h('div', { class: 'slot-sticker', html: stickerSvg(st) }) : h('div', { class: 'slot-empty' }, String(m.order)),
      h('div', { class: 'slot-name' }, m.title)));
  }
  const back = h('button', { class: 'ctl back', 'aria-label': 'Home', html: icon('home') });
  back.addEventListener('click', () => { narrator.stop(); nav.home(); });
  const el = h('div', { class: 'screen wall' }, h('h2', { class: 'wall-title' }, 'Station Wall'), slots, caption.el, h('div', { class: 'ctl-row left' }, back));
  setTimeout(() => void narrator.say(uiKey('wall')).then(() => caption.hide()), 500);
  return { el, destroy: () => narrator.stop() };
}

// ------------------------------------------------------------------ lights out
export function lightsOutScreen(s: Settings, nav: Nav, opts: { speak: boolean }): { el: HTMLElement; destroy(): void } {
  const caption = new Caption();
  caption.setVisible(s.captions);
  const narrator = new Narrator(caption);
  narrator.cast = castKey(s);
  const stage = new Stage();
  const el = h('div', { class: 'screen lightsout' }, stage.el, caption.el, h('div', { class: 'home-foot' }, h('span'), grownUpButton(nav, 'Grown-ups: hold')));
  requestAnimationFrame(() => stage.show({ place: 'sleep', time: 'night', lights: 'off', crew: 'bed', robot: 'dream', props: ['aurora'] }, {}, stageCtx(s, true), { instant: true }));
  music.set('bedtime');
  if (opts.speak) setTimeout(() => void narrator.say(uiKey('lights-out')).then(() => caption.hide()), 600);
  return { el, destroy: () => narrator.stop() };
}
