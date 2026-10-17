// Web Audio: one context, three volume buses, gentle ducking under the voice.
import { clock } from '../app/clock.ts';

type Bus = 'narration' | 'music' | 'sfx';

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private buses!: Record<Bus, GainNode>;
  private duck!: GainNode;
  private cache = new Map<string, Promise<AudioBuffer>>();
  private vol = { narration: 0.8, music: 0.25, sfx: 0.4 };
  muted = false;

  /** Must be called from a tap (browsers only allow sound after one). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC({ latencyHint: 'playback' });
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.duck = this.ctx.createGain();
      this.duck.connect(this.master);
      this.buses = {
        narration: this.ctx.createGain(),
        music: this.ctx.createGain(),
        sfx: this.ctx.createGain(),
      };
      this.buses.narration.connect(this.master);
      this.buses.music.connect(this.duck);
      this.buses.sfx.connect(this.master);
      this.applyVolumes();
      // iOS: play a silent sound inside the tap
      const b = this.ctx.createBuffer(1, 1, 22050);
      const s = this.ctx.createBufferSource();
      s.buffer = b; s.connect(this.ctx.destination); s.start(0);
    }
    if (this.ctx.state === 'suspended' && !clock.paused) void this.ctx.resume();
  }

  get ready() { return !!this.ctx; }

  setVolumes(v: { narration: number; music: number; sfx: number }) {
    this.vol = { ...v };
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // perceptual curve, and keep everything gentle
    const curve = (x: number) => x * x;
    this.buses.narration.gain.setTargetAtTime(curve(this.vol.narration) * 1.0, t, 0.05);
    this.buses.music.gain.setTargetAtTime(curve(this.vol.music) * 0.55, t, 0.2);
    this.buses.sfx.gain.setTargetAtTime(curve(this.vol.sfx) * 0.8, t, 0.05);
  }

  bus(name: Bus): GainNode | null { return this.ctx ? this.buses[name] : null; }

  duckMusic(on: boolean) {
    if (!this.ctx) return;
    this.duck.gain.setTargetAtTime(on ? 0.55 : 1, this.ctx.currentTime, on ? 0.15 : 0.6);
  }

  pause() { if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state !== 'running') void this.ctx.resume(); }

  /** Decode a sound once and keep it. `bytes` can supply the file another way than a plain fetch. */
  load(url: string, bytes: () => Promise<ArrayBuffer> = () => fetchBytes(url)): Promise<AudioBuffer> {
    let p = this.cache.get(url);
    if (!p) {
      p = bytes()
        .then((buf) => new Promise<AudioBuffer>((res, rej) => this.ctx!.decodeAudioData(buf, res, rej)));
      p.catch(() => this.cache.delete(url));
      this.cache.set(url, p);
      if (this.cache.size > 80) this.cache.delete(this.cache.keys().next().value!);
    }
    return p;
  }

  /** Play a decoded buffer on a bus. */
  play(buffer: AudioBuffer, bus: Bus) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.buses[bus]);
    const startAt = ctx.currentTime + 0.02;
    src.start(startAt);
    let done = false;
    const ended = new Promise<void>((res) => { src.onended = () => { done = true; res(); }; });
    return {
      startAt,
      ended,
      get done() { return done; },
      stop() { try { src.stop(); } catch { /* already stopped */ } },
      position: () => ctx.currentTime - startAt,
    };
  }
}

export function fetchBytes(url: string): Promise<ArrayBuffer> {
  return fetch(url).then((r) => { if (!r.ok) throw new Error(`audio ${r.status}`); return r.arrayBuffer(); });
}

export const audio = new AudioEngine();
