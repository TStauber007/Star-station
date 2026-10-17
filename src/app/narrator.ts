// Plays pre-recorded narration lines and keeps the caption in step.
import { audio } from '../audio/engine.ts';
import { clock } from './clock.ts';
import { NARRATION } from './content.ts';
import type { Caption } from '../ui/caption.ts';
import type { CastKey } from '../story/template.ts';

export interface Flags {
  /** QA/testing: skip audio, move fast */
  fast: boolean;
}

export const flags: Flags = { fast: false };

const BASE = import.meta.env.BASE_URL;

export function clipFor(key: string, cast: CastKey): string | null {
  const per = NARRATION.lines[key];
  if (!per) return null;
  return per[cast] ?? per['*'] ?? null;
}

export function clipUrl(id: string) { return `${BASE}narration/${id}.mp3`; }

export class Narrator {
  cast: CastKey = 'NN';
  private playing: ReturnType<typeof audio.play> | null = null;
  private raf = 0;
  private token = 0;
  private lastKey: string | null = null;
  private restart: (() => void) | null = null;

  constructor(private caption: Caption) {}

  /** Start fetching the audio for these lines. */
  prefetch(keys: string[]) {
    if (flags.fast || !audio.ready) return;
    for (const k of keys) {
      const id = clipFor(k, this.cast);
      if (id) void audio.load(clipUrl(id)).catch(() => {});
    }
  }

  /** Say a line. Resolves when it has been fully heard (or stopped). */
  async say(key: string): Promise<void> {
    const my = ++this.token;
    this.lastKey = key;
    const id = clipFor(key, this.cast);
    const clip = id ? NARRATION.clips[id] : null;
    const words = clip ? clip.w.map((w) => w[2]) : [];
    this.caption.show(words);
    if (flags.fast || !clip || !audio.ready) {
      await clock.wait(flags.fast ? 30 : Math.max(800, words.length * 380));
      if (my === this.token) this.caption.finish();
      return;
    }
    let buffer: AudioBuffer;
    try { buffer = await audio.load(clipUrl(id!)); }
    catch { await clock.wait(Math.max(800, words.length * 380)); return; }
    while (my === this.token) {
      await clock.whenRunning();
      if (my !== this.token) return;
      audio.duckMusic(true);
      const p = audio.play(buffer, 'narration');
      this.playing = p;
      let again = false;
      const restartP = new Promise<void>((res) => { this.restart = () => { again = true; res(); }; });
      const follow = () => {
        if (my !== this.token || p.done) return;
        const t = p.position();
        let idx = -1;
        for (let i = 0; i < clip.w.length; i++) if (t >= clip.w[i][0] - 0.03) idx = i;
        this.caption.highlight(idx);
        this.raf = requestAnimationFrame(follow);
      };
      this.raf = requestAnimationFrame(follow);
      await Promise.race([p.ended, restartP]);
      cancelAnimationFrame(this.raf);
      this.restart = null;
      p.stop();
      if (again) { this.caption.show(words); continue; }
      break;
    }
    if (my === this.token) {
      this.playing = null;
      audio.duckMusic(false);
      this.caption.finish();
    }
  }

  /** QA: show a line's caption without playing it (one word lit). */
  showOnly(key: string, lit = 2) {
    const id = clipFor(key, this.cast);
    const clip = id ? NARRATION.clips[id] : null;
    this.caption.show(clip ? clip.w.map((w) => w[2]) : []);
    if (clip) { for (let i = 0; i <= Math.min(lit, clip.w.length - 1); i++) this.caption.highlight(i); }
  }

  /** Say the last line again (the replay button). */
  replay(): boolean {
    if (this.restart) { this.restart(); return true; }
    return false;
  }

  get lastLine() { return this.lastKey; }

  stop() {
    this.token++;
    cancelAnimationFrame(this.raf);
    this.restart = null;
    this.playing?.stop();
    this.playing = null;
    audio.duckMusic(false);
  }
}
