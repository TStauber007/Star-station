// Settings live only in this tablet's local storage. Nothing ever leaves it.
import { DEFAULT_AVATARS, HAIR_STYLES, type Avatar, type Who } from '../art/crew.ts';
import { BUILT_IN, castKeyFor, type CastKey, type CrewSettings } from '../story/template.ts';

export interface Settings {
  v: 1;
  names: { A: string; T: string };
  avatars: Record<Who, Avatar>;
  crew: 'two' | 'solo';
  soloWho: Who;
  volume: { narration: number; music: number; sfx: number };
  captions: boolean;
  lightsOut: boolean;
  /** when lights-out locked the app (ms since epoch), or null */
  lockedAt: number | null;
  /** missionId -> sticker id */
  stickers: Record<string, string>;
}

const KEY = 'star-station:v1';
export const LOCK_HOURS = 6;

export function defaults(): Settings {
  return {
    v: 1,
    names: { A: BUILT_IN.A, T: BUILT_IN.T },
    avatars: { A: { ...DEFAULT_AVATARS.A }, T: { ...DEFAULT_AVATARS.T } },
    crew: 'two',
    soloWho: 'A',
    volume: { narration: 0.8, music: 0.25, sfx: 0.4 },
    captions: true,
    lightsOut: false,
    lockedAt: null,
    stickers: {},
  };
}

function clean(s: Partial<Settings>): Settings {
  const d = defaults();
  const num = (v: unknown, def: number) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : def);
  const name = (v: unknown, def: string) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 20) : def);
  const av = (v: any, def: Avatar): Avatar => ({
    skin: Number.isInteger(v?.skin) && v.skin >= 0 && v.skin < 5 ? v.skin : def.skin,
    hair: HAIR_STYLES.includes(v?.hair) ? v.hair : def.hair,
    hairColor: Number.isInteger(v?.hairColor) && v.hairColor >= 0 && v.hairColor < 6 ? v.hairColor : def.hairColor,
    shirt: Number.isInteger(v?.shirt) && v.shirt >= 0 && v.shirt < 7 ? v.shirt : def.shirt,
  });
  return {
    v: 1,
    names: { A: name(s.names?.A, d.names.A), T: name(s.names?.T, d.names.T) },
    avatars: { A: av(s.avatars?.A, d.avatars.A), T: av(s.avatars?.T, d.avatars.T) },
    crew: s.crew === 'solo' ? 'solo' : 'two',
    soloWho: s.soloWho === 'T' ? 'T' : 'A',
    volume: { narration: num(s.volume?.narration, d.volume.narration), music: num(s.volume?.music, d.volume.music), sfx: num(s.volume?.sfx, d.volume.sfx) },
    captions: s.captions !== false,
    lightsOut: s.lightsOut === true,
    lockedAt: typeof s.lockedAt === 'number' ? s.lockedAt : null,
    stickers: typeof s.stickers === 'object' && s.stickers ? { ...s.stickers } : {},
  };
}

let current: Settings | null = null;

export function load(): Settings {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    current = clean(raw ? JSON.parse(raw) : {});
  } catch {
    current = defaults();
  }
  return current;
}

export function save(next: Settings) {
  current = clean(next);
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* storage may be blocked; keep in memory */ }
  listeners.forEach((l) => l(current!));
}

export function update(fn: (s: Settings) => void) {
  const s = JSON.parse(JSON.stringify(load())) as Settings;
  fn(s);
  save(s);
}

const listeners: ((s: Settings) => void)[] = [];
export function onChange(fn: (s: Settings) => void) { listeners.push(fn); }

export function crewSettings(s: Settings): CrewSettings {
  return { mode: s.crew, soloWho: s.soloWho, names: s.names };
}

export function castKey(s: Settings): CastKey {
  return castKeyFor(crewSettings(s));
}

export function isLocked(s: Settings): boolean {
  if (!s.lockedAt) return false;
  if (Date.now() - s.lockedAt > LOCK_HOURS * 3600_000) return false;
  return true;
}

/** The name to show on screen for a child (what the parent typed). */
export function displayName(s: Settings, who: Who): string {
  return s.names[who];
}
