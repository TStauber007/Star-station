// Runs one mission: pages, lines, taps, hands-on moments, choices, ending.
import type { Beat, Mission, StateValues } from '../story/types.ts';
import { activeBeats } from '../story/paths.ts';
import { beatKey, choiceKey, optionKey, titleKey } from '../story/lines.ts';
import { renderDisplay } from '../story/template.ts';
import { cardSvg } from '../art/cards.ts';
import { resolveSticker } from '../art/stickers.ts';
import type { Who } from '../art/crew.ts';
import { Stage } from '../ui/stage.ts';
import { Caption } from '../ui/caption.ts';
import { ChoiceOverlay } from '../ui/choice.ts';
import { TurnBadge } from '../ui/turn.ts';
import { TAP_FX, KEEP_OVERLAY, targetFx, targetsFor } from '../ui/effects.ts';
import { h, holdButton } from '../ui/dom.ts';
import { icon } from '../ui/icons.ts';
import { audio } from '../audio/engine.ts';
import { music } from '../audio/music.ts';
import { playSfx } from '../audio/sfx.ts';
import { clock } from './clock.ts';
import { Narrator, flags } from './narrator.ts';
import { castKey, crewSettings, type Settings } from './settings.ts';

export interface PlayerHooks {
  onExit(): void;
  onFinished(m: Mission, sticker: string, lastArt: Stage): void;
}

export interface Probe {
  mission: string;
  page: string;
  beat: number;
  phase: string;
  state: StateValues;
  path: string[];
}

declare global { interface Window { __ss?: Probe } }

export class MissionPlayer {
  el: HTMLElement;
  stage = new Stage();
  caption = new Caption();
  narrator: Narrator;
  choice = new ChoiceOverlay();
  turn = new TurnBadge();
  private arrow: HTMLButtonElement;
  private pauseEl: HTMLElement;
  private titleEl: HTMLElement;
  private signal = { cancelled: false };
  private state: StateValues;
  private phase: 'title' | 'line' | 'tap' | 'do' | 'choice' | 'turn' | 'end' = 'title';
  private tapHandler: ((e: PointerEvent) => void) | null = null;
  private choiceReplay: (() => Promise<void>) | null = null;
  private lastStageTap = 0;
  private probe: Probe;

  constructor(private m: Mission, private settings: Settings, private hooks: PlayerHooks) {
    this.narrator = new Narrator(this.caption);
    this.narrator.cast = castKey(settings);
    this.state = { ...m.state };
    this.caption.setVisible(settings.captions);
    this.probe = { mission: m.id, page: '', beat: 0, phase: 'title', state: this.state, path: [] };
    window.__ss = this.probe;

    const home = h('button', { class: 'ctl home hold', 'aria-label': 'Hold to go home' }, h('span', { class: 'ring' }), h('span', { html: icon('home') }));
    holdButton(home, 1200, () => this.exit());
    const replay = h('button', { class: 'ctl replay', 'aria-label': 'Say it again', html: icon('replay') });
    replay.addEventListener('click', () => this.replay());
    const pause = h('button', { class: 'ctl pause', 'aria-label': 'Pause', html: icon('pause') });
    pause.addEventListener('click', () => this.pause());
    this.arrow = h('button', { class: 'arrow hidden', 'aria-label': 'Next page', html: icon('next') });
    this.pauseEl = h('div', { class: 'paused hidden' }, h('button', { class: 'resume', 'aria-label': 'Keep going', html: icon('play') }));
    this.pauseEl.addEventListener('click', () => this.resume());
    this.titleEl = h('div', { class: 'title-card hidden' });

    this.el = h('div', { class: `screen mission mood-${m.mood}` },
      this.stage.el, this.titleEl, this.caption.el, this.turn.el, this.choice.el, this.arrow,
      h('div', { class: 'ctl-row left' }, home), h('div', { class: 'ctl-row right' }, replay, pause), this.pauseEl);

    this.stage.el.addEventListener('pointerdown', (e) => this.onStageTap(e));
  }

  private get stageCtx() {
    const s = this.settings;
    return { avatars: s.avatars, crew: s.crew, soloWho: s.soloWho, bedtime: this.m.mood === 'bedtime' };
  }

  private get gap() { return this.m.mood === 'bedtime' ? 1000 : 650; }

  // -------------------------------------------------------------- run
  async run(startPage?: string) {
    const sig = this.signal;
    music.set(this.m.mood === 'bedtime' ? 'bedtime' : 'day');
    if (!startPage) await this.titleCard();
    let pageId = startPage ?? this.m.start;
    while (!sig.cancelled) {
      const page = this.m.pages[pageId];
      this.probe.page = pageId; this.probe.path.push(pageId);
      await this.playPage(pageId);
      if (sig.cancelled) return;
      if (page.end) break;
      if (page.choice) {
        const i = await this.ask(pageId);
        if (sig.cancelled) return;
        const opt = page.choice.options[i];
        Object.assign(this.state, opt.set ?? {});
        this.stage.setState(this.state);
        pageId = opt.next;
      } else {
        await this.turnPage();
        pageId = page.next!;
      }
    }
    if (sig.cancelled) return;
    this.phase = 'end'; this.probe.phase = 'end';
    this.turn.hide();
    const sticker = resolveSticker(this.m.sticker, this.state);
    this.hooks.onFinished(this.m, sticker, this.stage);
  }

  private async titleCard() {
    this.phase = 'title';
    this.stage.show(this.m.cover, this.state, this.stageCtx, { instant: true });
    this.titleEl.innerHTML = '';
    this.titleEl.append(h('div', { class: 'title-num' }, `Mission ${this.m.order}`), h('div', { class: 'title-name' }, this.m.title));
    this.titleEl.classList.remove('hidden');
    await clock.wait(400, this.signal);
    await this.narrator.say(titleKey(this.m));
    await clock.wait(700, this.signal);
    this.titleEl.classList.add('hidden');
    this.caption.hide();
  }

  private async playPage(pageId: string) {
    const page = this.m.pages[pageId];
    const beats = activeBeats(page, this.state);
    const keys = page.beats.map((b, i) => (beats.includes(b) ? beatKey(this.m, pageId, i) : null)).filter(Boolean) as string[];
    if (page.choice) keys.push(choiceKey(this.m, pageId), optionKey(this.m, pageId, 0), optionKey(this.m, pageId, 1));
    this.narrator.prefetch(keys);
    this.stage.show(page.art, this.state, this.stageCtx);
    music.set(this.m.mood === 'bedtime' ? 'bedtime' : page.art.time === 'night' || this.stage.currentArt.time === 'night' ? 'night' : 'day');
    await clock.wait(550, this.signal);
    for (const b of beats) {
      if (this.signal.cancelled) return;
      const i = page.beats.indexOf(b);
      this.probe.beat = i;
      await this.playBeat(pageId, i, b);
      await clock.wait(this.gap, this.signal);
    }
  }

  private whoFor(tpl: string, fallback: Who): Who {
    if (this.settings.crew === 'solo') return this.settings.soloWho;
    if (tpl.includes('{T}')) return 'T';
    if (tpl.includes('{A}')) return 'A';
    return fallback;
  }

  private showTurn(who: Who) {
    const s = this.settings;
    const name = renderDisplay(who === 'A' ? '{A}' : '{T}', crewSettings(s));
    this.turn.show(who, s.avatars[who], name, s.crew === 'solo' ? 'left' : who === 'A' ? 'left' : 'right');
  }

  private async playBeat(pageId: string, i: number, b: Beat) {
    if (b.art) this.stage.patch(b.art, this.state);
    if (b.sfx) playSfx(b.sfx);
    const interactive = !!(b.tap || b.do);
    if (interactive) this.showTurn(this.whoFor(b.say, b.tap ? 'T' : 'A'));
    else this.turn.hide();
    this.phase = 'line'; this.probe.phase = 'line';
    await this.narrator.say(beatKey(this.m, pageId, i));
    if (this.signal.cancelled) return;
    if (b.tap) await this.tapMoment(b.tap.effect, b.tap.count);
    if (b.do) await this.handsOn(b.do.targets);
    this.turn.hide();
  }

  // -------------------------------------------------------------- tap anything
  private tapMoment(effect: string, count: number): Promise<void> {
    this.phase = 'tap'; this.probe.phase = `tap:${effect}:${count}`;
    this.stage.el.classList.add('tap-mode');
    let n = 0;
    let last = 0;
    return new Promise((resolve) => {
      const hint = setTimeout(() => this.stage.el.classList.add('tap-hint'), 9000);
      const finish = () => {
        clearTimeout(hint);
        this.tapHandler = null;
        this.stage.el.classList.remove('tap-mode', 'tap-hint');
        if (!KEEP_OVERLAY.has(effect)) setTimeout(() => this.stage.overlay('transparent', 0, 'sky'), 50);
        setTimeout(resolve, 700);
      };
      this.tapHandler = (e: PointerEvent) => {
        const now = performance.now();
        if (now - last < 280 || n >= count || clock.paused) return;
        last = now;
        n++;
        const r = this.stage.el.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        this.stage.sparkle(px, py);
        this.stage.el.classList.remove('tap-hint');
        try { TAP_FX[effect]?.({ stage: this.stage, i: n, count, px, py, state: this.state }); } catch (err) { console.warn(err); }
        if (n >= count) finish();
      };
      if (flags.fast) {
        const r = this.stage.el.getBoundingClientRect();
        const auto = () => { if (n < count && this.tapHandler) { this.tapHandler({ clientX: r.left + r.width * (0.3 + Math.random() * 0.4), clientY: r.top + r.height * 0.4 } as PointerEvent); last = 0; setTimeout(auto, 20); } };
        setTimeout(auto, 20);
      }
      const watch = () => { if (this.signal.cancelled) { clearTimeout(hint); this.tapHandler = null; resolve(); } else if (this.tapHandler) setTimeout(watch, 250); };
      watch();
    });
  }

  private onStageTap(e: PointerEvent) {
    if (this.tapHandler) { this.tapHandler(e); return; }
    // anywhere else: a tiny, quiet twinkle, never more than a few a second
    const now = performance.now();
    if (now - this.lastStageTap < 350 || this.phase === 'choice') return;
    this.lastStageTap = now;
    const r = this.stage.el.getBoundingClientRect();
    this.stage.sparkle(e.clientX - r.left, e.clientY - r.top, { count: 3, size: 34 });
  }

  // -------------------------------------------------------------- hands-on
  private async handsOn(name: string) {
    this.phase = 'do'; this.probe.phase = `do:${name}`;
    const list = targetsFor(name, this.stage);
    if (!list.length) { console.warn('no targets for', name); return; }
    let order = 0;
    const done = this.stage.targets(list, (i, left, el) => {
      targetFx({ stage: this.stage, name, i, left, el, order: order++ });
    }, this.signal);
    if (flags.fast) {
      setTimeout(() => {
        this.stage.targetLayer.querySelectorAll<HTMLElement>('.target').forEach((t) => {
          const taps = list[Number([...t.parentElement!.children].indexOf(t))]?.taps ?? 1;
          for (let k = 0; k < taps; k++) t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        });
      }, 30);
    }
    await done;
    if (!this.signal.cancelled) { playSfx('done'); await clock.wait(500, this.signal); }
  }

  // -------------------------------------------------------------- choices
  private async ask(pageId: string): Promise<number> {
    const page = this.m.pages[pageId];
    const c = page.choice!;
    this.phase = 'choice'; this.probe.phase = 'choice';
    this.showTurn(this.whoFor(c.say, 'A'));
    const cs = crewSettings(this.settings);
    const ctx = { avatars: this.settings.avatars, crew: this.settings.crew, soloWho: this.settings.soloWho };
    this.choice.open(c.options.map((o) => ({ svg: cardSvg(o.card, ctx), label: renderDisplay(o.label, cs) })));
    const readAll = async () => {
      this.choice.glow(null);
      await this.narrator.say(choiceKey(this.m, pageId));
      for (let i = 0; i < c.options.length; i++) {
        if (this.signal.cancelled || this.phase !== 'choice') return;
        this.choice.glow(i);
        await this.narrator.say(optionKey(this.m, pageId, i));
        await clock.wait(250, this.signal);
      }
      this.choice.glow(null);
    };
    this.choiceReplay = readAll;
    await readAll();
    this.choice.enable();
    this.probe.phase = 'choose';
    const picked = flags.fast && (window as any).__ssPick ? await Promise.race([this.choice.wait(), Promise.resolve((window as any).__ssPick(pageId) as number)]) : await this.choice.wait();
    this.choiceReplay = null;
    this.narrator.stop();
    playSfx('select');
    await clock.wait(flags.fast ? 20 : 900, this.signal);
    this.choice.close();
    this.turn.hide();
    this.caption.hide();
    return picked;
  }

  // -------------------------------------------------------------- page turn
  private turnPage(): Promise<void> {
    this.phase = 'turn'; this.probe.phase = 'turn';
    this.turn.hide();
    if (flags.fast) return clock.wait(20);
    this.arrow.classList.remove('hidden');
    return new Promise((resolve) => {
      const go = () => {
        this.arrow.removeEventListener('click', go);
        this.arrow.classList.add('hidden');
        playSfx('page');
        this.caption.hide();
        resolve();
      };
      this.arrow.addEventListener('click', go);
      const watch = () => { if (this.signal.cancelled) resolve(); else if (!this.arrow.classList.contains('hidden')) setTimeout(watch, 250); };
      watch();
    });
  }

  // -------------------------------------------------------------- QA preview
  /** Show one moment of a page without sound (for screenshots). */
  async preview(pageId: string, at: string, state: StateValues) {
    Object.assign(this.state, state);
    const page = this.m.pages[pageId];
    this.probe.page = pageId;
    if (at === 'title') {
      this.stage.show(this.m.cover, this.state, this.stageCtx, { instant: true });
      this.titleEl.append(h('div', { class: 'title-num' }, `Mission ${this.m.order}`), h('div', { class: 'title-name' }, this.m.title));
      this.titleEl.classList.remove('hidden');
      this.narrator.showOnly(titleKey(this.m));
      return;
    }
    this.stage.show(page.art, this.state, this.stageCtx, { instant: true });
    const beats = activeBeats(page, this.state);
    const upto = at === 'end' || at === 'choice' || at === 'none' ? Infinity : Number(at);
    let last: Beat | null = null;
    for (const b of beats) {
      const i = page.beats.indexOf(b);
      if (i > upto) break;
      if (b.art) this.stage.patch(b.art, this.state);
      last = b;
    }
    await new Promise((r) => setTimeout(r, 50));
    if (at === 'none') return;
    if (at === 'choice' && page.choice) {
      const c = page.choice;
      this.showTurn(this.whoFor(c.say, 'A'));
      const ctx = { avatars: this.settings.avatars, crew: this.settings.crew, soloWho: this.settings.soloWho };
      this.choice.open(c.options.map((o) => ({ svg: cardSvg(o.card, ctx), label: renderDisplay(o.label, crewSettings(this.settings)) })));
      this.choice.enable();
      this.narrator.showOnly(choiceKey(this.m, pageId));
      return;
    }
    if (at === 'end') {
      if (last) this.narrator.showOnly(beatKey(this.m, pageId, page.beats.indexOf(last)), 999);
      if (page.next) this.arrow.classList.remove('hidden');
      return;
    }
    if (last) {
      const i = page.beats.indexOf(last);
      this.narrator.showOnly(beatKey(this.m, pageId, i));
      if (last.tap || last.do) this.showTurn(this.whoFor(last.say, last.tap ? 'T' : 'A'));
      if (last.tap) this.stage.el.classList.add('tap-mode');
      if (last.do) {
        const list = targetsFor(last.do.targets, this.stage);
        void this.stage.targets(list, () => {}, this.signal);
      }
    }
  }

  // -------------------------------------------------------------- controls
  private replay() {
    if (clock.paused) return;
    if (this.phase === 'choice' && this.choiceReplay) {
      // read the question and both cards again
      if (!this.narrator.replay()) void this.choiceReplay();
      return;
    }
    if (!this.narrator.replay() && this.narrator.lastLine) void this.narrator.say(this.narrator.lastLine);
  }

  private pause() {
    clock.pause();
    audio.pause();
    this.pauseEl.classList.remove('hidden');
  }

  private resume() {
    this.pauseEl.classList.add('hidden');
    audio.resume();
    clock.resume();
  }

  exit() {
    this.cancel();
    this.hooks.onExit();
  }

  cancel() {
    this.signal.cancelled = true;
    this.narrator.stop();
    if (clock.paused) { audio.resume(); clock.resume(); }
  }
}
