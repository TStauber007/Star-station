// The stage: layered, code-drawn scenes that fill the screen in any shape.
// Layers (back to front): outside world, twinkling stars, the room,
// actors (crew, Button, props), a colour wash, effects, tap targets.
// Only transforms and opacity animate, so the GPU does the work.
import type { SceneArt, StateValues } from '../story/types.ts';
import { composeScene, type Actor, type ComposeCtx, type Scene } from '../art/compose.ts';
import { C } from '../art/palette.ts';
import { sparklePath, starPath } from '../art/svg.ts';
import { h } from './dom.ts';

export interface StageCtx extends Omit<ComposeCtx, 'W' | 'state'> {}

export interface TargetSpec { x: number; y: number; r: number; taps: number }

const FADE = 650;

function mergeArt(base: SceneArt, patch: SceneArt): SceneArt {
  const out: SceneArt = { ...base };
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) (out as any)[k] = v;
  return out;
}

export class Stage {
  el: HTMLElement;
  private page: HTMLElement | null = null;
  private layers: Record<string, HTMLElement> = {};
  private actorEls = new Map<string, HTMLElement>();
  private actorSpecs = new Map<string, Actor>();
  private scene: Scene | null = null;
  private art: SceneArt = {};
  private state: StateValues = {};
  private ctx: StageCtx | null = null;
  private placeKey = '';
  W = 1333;
  s = 1;
  private pxW = 0;
  private pxH = 0;
  fxLayer: HTMLElement;
  targetLayer: HTMLElement;
  private overlayEls: HTMLElement[] = [];

  constructor() {
    this.el = h('div', { class: 'stage' });
    this.fxLayer = h('div', { class: 'layer fx' });
    this.targetLayer = h('div', { class: 'layer targets' });
    this.el.append(this.fxLayer, this.targetLayer);
    new ResizeObserver(() => this.resize()).observe(this.el);
  }

  private measure() {
    const r = this.el.getBoundingClientRect();
    this.pxW = r.width || window.innerWidth;
    this.pxH = r.height || window.innerHeight;
    this.s = this.pxH / 1000;
    this.W = (this.pxW / this.pxH) * 1000;
  }

  /** design units -> pixels inside the stage */
  px(x: number, y: number): [number, number] { return [this.pxW / 2 + x * this.s, y * this.s]; }
  /** pixels inside the stage -> design units */
  design(px: number, py: number): { x: number; y: number } { return { x: (px - this.pxW / 2) / this.s, y: py / this.s }; }

  get currentArt() { return this.art; }

  /** Show a new page's art. Crossfades if the place changed. */
  show(art: SceneArt, state: StateValues, ctx: StageCtx, opts: { instant?: boolean } = {}) {
    this.ctx = ctx;
    this.state = state;
    this.art = { ...art };
    this.clearFx();
    this.render(opts.instant ? 'instant' : 'page');
  }

  /** Change part of the art (a beat's art, or a tap effect). */
  patch(p: SceneArt, state?: StateValues) {
    if (state) this.state = state;
    this.art = mergeArt(this.art, p);
    this.render('patch');
  }

  setState(state: StateValues) { this.state = state; }

  private resize() {
    const oldW = this.pxW, oldH = this.pxH;
    this.measure();
    if (!this.ctx || (Math.abs(oldW - this.pxW) < 1 && Math.abs(oldH - this.pxH) < 1)) return;
    this.render('instant');
  }

  private render(mode: 'page' | 'patch' | 'instant') {
    if (!this.ctx) return;
    this.measure();
    const scene = composeScene(this.art, { ...this.ctx, W: this.W, state: this.state });
    const place = (k: string) => k.split('|')[0];
    if (!this.page || mode === 'instant') {
      // first page, or the screen changed shape: rebuild in place
      this.buildPage(scene, false);
      this.syncActors(scene, false);
    } else if (mode === 'page' && place(scene.placeKey) !== place(this.placeKey)) {
      // a new place: the whole picture crossfades
      this.buildPage(scene, true);
      this.syncActors(scene, false);
    } else {
      // same place: only what changed moves or fades
      this.updateLayers(scene, true);
      this.syncActors(scene, true);
    }
    this.scene = scene;
    this.placeKey = scene.placeKey;
  }

  private buildPage(scene: Scene, fade: boolean) {
    const old = this.page;
    const page = h('div', { class: 'page' });
    const mk = (name: string) => { const l = h('div', { class: `layer ${name}` }); page.append(l); return l; };
    this.layers = { back: mk('back'), twinkles: mk('twinkles'), room: mk('room'), actors: mk('actors'), wash: mk('wash') };
    this.fillLayer('back', scene.layers.back);
    this.fillTwinkles(scene);
    this.fillLayer('room', scene.layers.room);
    this.fillWash(scene);
    this.actorEls = new Map();
    this.actorSpecs = new Map();
    this.el.insertBefore(page, this.fxLayer);
    this.page = page;
    if (old && fade) {
      page.style.opacity = '0';
      requestAnimationFrame(() => { page.style.transition = `opacity ${FADE}ms ease`; page.style.opacity = '1'; });
      setTimeout(() => old.remove(), FADE + 60);
    } else old?.remove();
  }

  private svgFor(layer: string, inner: string) {
    const top = -0, H = 1000;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="${layer}-svg" viewBox="${(-this.W / 2).toFixed(1)} ${top} ${this.W.toFixed(1)} ${H}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
  }

  private fillLayer(name: 'back' | 'room', inner: string) {
    const l = this.layers[name];
    l.innerHTML = inner ? this.svgFor(name, inner) : '';
    l.dataset.src = inner;
  }

  private fillTwinkles(scene: Scene) {
    const l = this.layers.twinkles;
    l.innerHTML = '';
    for (const t of scene.layers.twinkles) {
      const [x, y] = this.px(t.x, t.y);
      const size = t.r * 2 * this.s * 1.6;
      const d = h('div', { class: 'twinkle', style: `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;animation-delay:${-t.d}s` });
      l.append(d);
    }
  }

  private fillWash(scene: Scene) {
    const w = scene.layers.wash;
    this.layers.wash.style.background = w ? w.color : 'transparent';
    this.layers.wash.style.opacity = w ? String(w.opacity) : '0';
  }

  private updateLayers(scene: Scene, fade: boolean) {
    for (const name of ['back', 'room'] as const) {
      const inner = scene.layers[name];
      const l = this.layers[name];
      if (l.dataset.src === inner) continue;
      if (fade && l.firstChild) {
        const old = l.firstElementChild as HTMLElement | SVGElement;
        const tmp = document.createElement('div');
        tmp.innerHTML = inner ? this.svgFor(name, inner) : '';
        const nu = tmp.firstElementChild as SVGElement | null;
        if (nu) { nu.style.opacity = '0'; nu.style.transition = 'opacity 500ms ease'; l.append(nu); requestAnimationFrame(() => (nu.style.opacity = '1')); }
        setTimeout(() => old.remove(), 560);
        l.dataset.src = inner;
      } else this.fillLayer(name, inner);
    }
    this.fillTwinkles(scene);
    this.fillWash(scene);
  }

  private placeActor(el: HTMLElement, a: Actor) {
    const [x, y] = this.px(a.x, a.y);
    const w = a.w * this.s, hh = a.h * this.s;
    el.style.width = `${w}px`;
    el.style.height = `${hh}px`;
    el.style.transform = `translate(${x - w / 2}px, ${y - hh / 2}px)`;
    el.style.zIndex = String(a.z);
  }

  private actorInner(a: Actor): HTMLElement {
    const pose = h('div', { class: 'pose', style: `transform:${a.rot ? `rotate(${a.rot}deg)` : ''}${a.flip ? ' scaleX(-1)' : ''}` });
    pose.innerHTML = a.svg;
    return h('div', { class: `anim ${a.anim ?? ''}` }, pose);
  }

  private syncActors(scene: Scene, animate: boolean) {
    if (!this.layers.actors) return;
    const seen = new Set<string>();
    for (const a of scene.actors) {
      seen.add(a.id);
      const prev = this.actorSpecs.get(a.id);
      let el = this.actorEls.get(a.id);
      if (!el) {
        el = h('div', { class: 'actor', 'data-id': a.id });
        el.append(this.actorInner(a));
        this.placeActor(el, a);
        if (animate) { el.style.opacity = '0'; requestAnimationFrame(() => { el!.style.transition = 'opacity 500ms ease, transform 700ms ease'; el!.style.opacity = '1'; }); }
        else el.style.transition = 'opacity 500ms ease, transform 700ms ease';
        this.layers.actors.append(el);
        this.actorEls.set(a.id, el);
      } else {
        if (!prev || prev.svg !== a.svg || prev.anim !== a.anim || prev.flip !== a.flip || prev.rot !== a.rot) {
          const oldInner = el.firstElementChild as HTMLElement;
          const nu = this.actorInner(a);
          if (animate && oldInner) {
            nu.style.opacity = '0';
            el.append(nu);
            requestAnimationFrame(() => { nu.style.transition = 'opacity 380ms ease'; nu.style.opacity = '1'; oldInner.style.transition = 'opacity 380ms ease'; oldInner.style.opacity = '0'; });
            setTimeout(() => oldInner.remove(), 420);
          } else { oldInner?.remove(); el.append(nu); }
        }
        this.placeActor(el, a);
      }
      this.actorSpecs.set(a.id, a);
    }
    for (const [id, el] of this.actorEls) {
      if (seen.has(id)) continue;
      this.actorEls.delete(id);
      this.actorSpecs.delete(id);
      if (animate) { el.style.opacity = '0'; setTimeout(() => el.remove(), 520); } else el.remove();
    }
  }

  actor(id: string): HTMLElement | undefined { return this.actorEls.get(id); }
  actorSpec(id: string): Actor | undefined { return this.actorSpecs.get(id); }
  actors(): Actor[] { return [...this.actorSpecs.values()]; }

  /** Play a one-shot CSS animation on an actor. */
  bump(id: string, cls: string, ms = 700) {
    const el = this.actorEls.get(id)?.querySelector('.pose') as HTMLElement | null;
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  // --------------------------------------------------------------- effects
  clearFx() {
    this.fxLayer.innerHTML = '';
    this.overlayEls = [];
  }

  /** A little twinkle where a finger touched (pixel coords inside the stage). */
  sparkle(px: number, py: number, opts: { color?: string; size?: number; count?: number } = {}) {
    const n = opts.count ?? 5;
    const size = (opts.size ?? 46) * Math.max(0.8, this.s);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random();
      const d = size * (0.9 + Math.random() * 0.8);
      const el = h('div', { class: 'fx-spark', style: `left:${px - size / 2}px;top:${py - size / 2}px;width:${size}px;height:${size}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;animation-delay:${i * 30}ms` });
      el.innerHTML = `<svg viewBox="-50 -50 100 100"><path d="${i % 2 ? sparklePath(0, 0, 44) : starPath(0, 0, 40)}" fill="${opts.color ?? (i % 2 ? '#fff6c8' : C.sunflower)}"/></svg>`;
      this.fxLayer.append(el);
      setTimeout(() => el.remove(), 1300);
    }
  }

  /** Floating thing from a point: bubble, heart, note, water ball. */
  floatUp(px: number, py: number, kind: 'bubble' | 'heart' | 'note' | 'water' | 'ribbon') {
    const size = (kind === 'ribbon' ? 140 : 70) * Math.max(0.8, this.s);
    const svg: Record<string, string> = {
      bubble: `<circle r="40" fill="#bfe6ff" opacity="0.55"/><circle r="40" fill="none" stroke="#fff" stroke-width="4" opacity="0.8"/><ellipse cx="-14" cy="-16" rx="10" ry="6" fill="#fff" opacity="0.8"/>`,
      heart: `<path d="M0 26 C-40 0 -26 -34 0 -14 C26 -34 40 0 0 26Z" fill="${C.rose}"/>`,
      note: `<ellipse cx="-8" cy="20" rx="14" ry="10" fill="${C.lavender}"/><path d="M4 20 V-30" stroke="${C.lavender}" stroke-width="6"/>`,
      water: `<circle r="34" fill="${C.water}" opacity="0.85"/><ellipse cx="-12" cy="-12" rx="9" ry="6" fill="#fff" opacity="0.8"/>`,
      ribbon: `<path d="M-45 10 q20 -30 45 -5 t45 -5" fill="none" stroke="#e8f4ff" stroke-width="8" stroke-linecap="round" opacity="0.8"/>`,
    };
    const el = h('div', { class: `fx-float ${kind}`, style: `left:${px - size / 2}px;top:${py - size / 2}px;width:${size}px;height:${size}px;--drift:${(Math.random() - 0.5) * 80}px` });
    el.innerHTML = `<svg viewBox="-50 -50 100 100">${svg[kind]}</svg>`;
    this.fxLayer.append(el);
    setTimeout(() => el.remove(), 2600);
  }

  /** A star that stays (Tommy wakes up the stars). */
  addStar(px: number, py: number) {
    const size = 56 * Math.max(0.8, this.s);
    const el = h('div', { class: 'fx-star', style: `left:${px - size / 2}px;top:${py - size / 2}px;width:${size}px;height:${size}px` });
    el.innerHTML = `<svg viewBox="-50 -50 100 100"><circle r="46" fill="${C.star}" opacity="0.18"/><path d="${sparklePath(0, 0, 44)}" fill="${C.star}"/></svg>`;
    this.fxLayer.append(el);
  }

  /** A soft full-stage overlay that stays until the page changes. */
  overlay(color: string, opacity: number, kind = 'flat') {
    let el = this.overlayEls.find((o) => o.dataset.kind === kind);
    if (!el) {
      el = h('div', { class: `fx-overlay ${kind}`, 'data-kind': kind });
      this.fxLayer.prepend(el);
      this.overlayEls.push(el);
    }
    el.style.background = kind === 'horizon' ? `radial-gradient(ellipse at 50% 100%, ${color} 0%, transparent 65%)` : color;
    el.style.opacity = String(opacity);
  }

  /** A small badge that stays (a meter, a counter). */
  badge(id: string, px: number, py: number, html: string) {
    let el = this.fxLayer.querySelector<HTMLElement>(`[data-badge="${id}"]`);
    if (!el) { el = h('div', { class: 'fx-badge', 'data-badge': id }); this.fxLayer.append(el); }
    el.style.left = `${px}px`; el.style.top = `${py}px`;
    el.innerHTML = html;
    return el;
  }

  // --------------------------------------------------------------- targets
  /** Show big tap targets; resolves when every one has been tapped enough. */
  targets(list: TargetSpec[], onTap: (i: number, left: number, el: HTMLElement) => void, signal: { cancelled: boolean }): Promise<void> {
    this.targetLayer.innerHTML = '';
    let remaining = list.length;
    return new Promise((resolve) => {
      list.forEach((t, i) => {
        const [x, y] = this.px(t.x, t.y);
        const size = Math.max(t.r * 2 * this.s, 104);
        let left = t.taps;
        const b = h('button', { class: 'target', 'aria-label': 'Tap here', style: `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px` });
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (left <= 0 || signal.cancelled) return;
          left--;
          onTap(i, left, b);
          if (left === 0) {
            b.classList.add('done');
            remaining--;
            if (remaining === 0) setTimeout(() => { this.targetLayer.innerHTML = ''; resolve(); }, 350);
          }
        });
        this.targetLayer.append(b);
      });
      const poll = () => { if (signal.cancelled) { this.targetLayer.innerHTML = ''; resolve(); } else setTimeout(poll, 200); };
      poll();
    });
  }

  clearTargets() { this.targetLayer.innerHTML = ''; }
}
