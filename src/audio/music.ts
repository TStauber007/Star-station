// Soft ambient music, made on the fly: slow pad chords and a few music-box notes.
import { audio } from './engine.ts';

export type Mood = 'home' | 'day' | 'night' | 'bedtime' | 'off';

interface MoodDef {
  chords: number[][]; // MIDI notes
  secs: number; // per chord
  noteEvery: [number, number]; // seconds between music-box notes
  scale: number[];
  cutoff: number;
  level: number;
}

const MOODS: Record<Exclude<Mood, 'off'>, MoodDef> = {
  home: { chords: [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 62]], secs: 9, noteEvery: [2.5, 5], scale: [72, 74, 76, 79, 81, 84], cutoff: 1100, level: 1 },
  day: { chords: [[48, 55, 64, 71], [41, 48, 57, 64], [45, 52, 60, 67], [43, 50, 59, 66]], secs: 10, noteEvery: [3, 6.5], scale: [72, 74, 76, 79, 81, 84], cutoff: 1000, level: 0.9 },
  night: { chords: [[45, 52, 60, 64], [41, 48, 57, 60], [48, 55, 60, 64], [43, 50, 55, 62]], secs: 11, noteEvery: [4, 8], scale: [69, 72, 74, 76, 79], cutoff: 750, level: 0.85 },
  bedtime: { chords: [[41, 48, 57, 64], [38, 45, 53, 60], [36, 43, 52, 57], [43, 50, 55, 62]], secs: 14, noteEvery: [6, 11], scale: [65, 69, 72, 74, 77], cutoff: 600, level: 0.7 },
};

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class Music {
  private mood: Mood = 'off';
  private out: GainNode | null = null;
  private timer = 0;
  private chordIdx = 0;
  private nextChord = 0;
  private nextNote = 0;
  private voices: { o: OscillatorNode[]; g: GainNode }[] = [];
  private delay: DelayNode | null = null;

  set(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    const ctx = audio.ctx, bus = audio.bus('music');
    if (!ctx || !bus) return;
    // fade out the old layer
    if (this.out) {
      const old = this.out;
      old.gain.setTargetAtTime(0, ctx.currentTime, 1.2);
      setTimeout(() => old.disconnect(), 6000);
      this.voices = [];
    }
    clearInterval(this.timer);
    if (mood === 'off') { this.out = null; return; }
    const def = MOODS[mood];
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(def.level, ctx.currentTime, 2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = def.cutoff; lp.Q.value = 0.3;
    out.connect(lp); lp.connect(bus);
    // a soft echo for the music box
    this.delay = ctx.createDelay(1.5);
    this.delay.delayTime.value = 0.42;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    this.delay.connect(fb); fb.connect(this.delay); this.delay.connect(lp);
    this.out = out;
    this.chordIdx = 0;
    this.nextChord = ctx.currentTime + 0.1;
    this.nextNote = ctx.currentTime + 2;
    this.timer = window.setInterval(() => this.tick(def), 250);
    this.tick(def);
  }

  private tick(def: MoodDef) {
    const ctx = audio.ctx;
    if (!ctx || !this.out || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (now + 0.5 >= this.nextChord) {
      this.playChord(def.chords[this.chordIdx % def.chords.length], this.nextChord, def.secs);
      this.chordIdx++;
      this.nextChord += def.secs;
    }
    if (now + 0.5 >= this.nextNote) {
      const m = def.scale[Math.floor(Math.random() * def.scale.length)];
      this.playNote(hz(m), this.nextNote);
      this.nextNote += def.noteEvery[0] + Math.random() * (def.noteEvery[1] - def.noteEvery[0]);
    }
  }

  private playChord(notes: number[], t: number, secs: number) {
    const ctx = audio.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + secs * 0.35);
    g.gain.linearRampToValueAtTime(0.05, t + secs * 0.8);
    g.gain.linearRampToValueAtTime(0, t + secs * 1.25);
    g.connect(this.out!);
    const os = notes.map((n, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = hz(n);
      o.detune.value = (i % 2 ? 4 : -4);
      const og = ctx.createGain(); og.gain.value = i === 0 ? 0.9 : 0.35;
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + secs * 1.3);
      return o;
    });
    this.voices.push({ o: os, g });
    if (this.voices.length > 4) this.voices.shift();
  }

  private playNote(f: number, t: number) {
    const ctx = audio.ctx!;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g); g.connect(this.out!); if (this.delay) g.connect(this.delay);
    o.start(t); o.stop(t + 2.5);
  }
}

export const music = new Music();
