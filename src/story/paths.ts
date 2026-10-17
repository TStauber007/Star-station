// Walks every path through a mission, tracking what the story remembers.
import type { Beat, Mission, Page, StateValues } from './types.ts';

export interface PathStep {
  pageId: string;
  /** beats that play on this page for this path's state */
  beats: Beat[];
  /** index of the option chosen at this page, if it had a choice */
  chose?: number;
}

export interface MissionPath {
  steps: PathStep[];
  state: StateValues;
  endPage: string;
}

export function beatApplies(b: Beat, state: StateValues): boolean {
  if (!b.if) return true;
  return Object.entries(b.if).every(([k, v]) => state[k] === v);
}

export function activeBeats(page: Page, state: StateValues): Beat[] {
  return page.beats.filter((b) => beatApplies(b, state));
}

export class PathError extends Error {}

export function allPaths(m: Mission, limit = 5000): MissionPath[] {
  const out: MissionPath[] = [];
  const walk = (pageId: string, state: StateValues, steps: PathStep[], seen: Set<string>) => {
    if (out.length > limit) throw new PathError('too many paths');
    const page = m.pages[pageId];
    if (!page) throw new PathError(`missing page "${pageId}"`);
    if (seen.has(pageId)) throw new PathError(`loop back to page "${pageId}"`);
    const nextSeen = new Set(seen).add(pageId);
    const beats = activeBeats(page, state);
    if (page.end) {
      out.push({ steps: [...steps, { pageId, beats }], state, endPage: pageId });
      return;
    }
    if (page.choice) {
      page.choice.options.forEach((opt, i) => {
        const s2 = { ...state, ...(opt.set ?? {}) };
        walk(opt.next, s2, [...steps, { pageId, beats, chose: i }], nextSeen);
      });
      return;
    }
    if (page.next) {
      walk(page.next, state, [...steps, { pageId, beats }], nextSeen);
      return;
    }
    throw new PathError(`page "${pageId}" is a dead end (no next, choice, or end)`);
  };
  walk(m.start, { ...m.state }, [], new Set());
  return out;
}
