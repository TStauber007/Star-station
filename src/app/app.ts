// The app shell: moves between screens. Calm transitions, nothing automatic.
import type { Mission } from '../story/types.ts';
import { MissionPlayer } from './player.ts';
import { load, update, isLocked } from './settings.ts';
import { homeScreen, lightsOutScreen, showEnding, splashScreen, wallScreen, type Nav } from '../ui/screens.ts';
import { parentScreen } from '../ui/parent.ts';
import { audio } from '../audio/engine.ts';
import { music } from '../audio/music.ts';

export class App implements Nav {
  private current: { el: HTMLElement; destroy(): void } | null = null;
  private player: MissionPlayer | null = null;
  private endSignal = { cancelled: false };
  private greeted = false;

  constructor(private root: HTMLElement) {}

  start() {
    this.mount({ el: splashScreen(() => this.unlockAndGo()), destroy() {} });
  }

  private unlockAndGo() {
    audio.unlock();
    audio.setVolumes(load().volume);
    if (isLocked(load())) this.lightsOut(false);
    else this.home();
  }

  private mount(next: { el: HTMLElement; destroy(): void }) {
    const old = this.current;
    this.endSignal.cancelled = true;
    this.endSignal = { cancelled: false };
    if (this.player && this.player.el !== next.el) { this.player.cancel(); this.player = null; }
    old?.destroy();
    next.el.classList.add('entering');
    this.root.append(next.el);
    requestAnimationFrame(() => requestAnimationFrame(() => next.el.classList.remove('entering')));
    if (old) { old.el.classList.add('leaving'); setTimeout(() => old.el.remove(), 600); }
    this.current = next;
  }

  home() {
    if (isLocked(load())) { this.lightsOut(false); return; }
    const greet = !this.greeted;
    this.greeted = true;
    this.mount(homeScreen(load(), this, { greet }));
  }

  play(m: Mission) {
    const p = new MissionPlayer(m, load(), {
      onExit: () => this.home(),
      onFinished: (mm, sticker) => this.finished(mm, sticker),
    });
    this.mount({ el: p.el, destroy: () => p.cancel() });
    this.player = p;
    void p.run();
  }

  private finished(m: Mission, sticker: string) {
    update((s) => { s.stickers[m.id] = sticker; });
    const host = this.current!.el;
    void showEnding(host, m, sticker, load(), this, this.endSignal);
  }

  wall() { this.mount(wallScreen(load(), this)); }

  parent() {
    music.set('off');
    this.mount(parentScreen(() => { audio.setVolumes(load().volume); this.home(); }));
  }

  lightsOut(speak = true) {
    if (load().lightsOut && !isLocked(load())) update((s) => { s.lockedAt = Date.now(); });
    this.mount(lightsOutScreen(load(), this, { speak }));
  }
}
