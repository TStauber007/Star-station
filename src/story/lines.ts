// Every narrated line, with a stable key. Shared by the app and build tools.
import type { Mission } from './types.ts';

export interface LineRef {
  key: string;
  tpl: string;
  speed: number;
}

export const DEFAULT_SPEED = 0.82;

export function missionSpeed(m: Mission): number {
  return m.speed ?? DEFAULT_SPEED;
}

export const titleKey = (m: Mission) => `${m.id}:title`;
export const beatKey = (m: Mission, pageId: string, i: number) => `${m.id}:${pageId}:${i}`;
export const choiceKey = (m: Mission, pageId: string) => `${m.id}:${pageId}:choice`;
export const optionKey = (m: Mission, pageId: string, i: number) => `${m.id}:${pageId}:opt${i}`;
export const uiKey = (id: string) => `ui:${id}`;

export function missionLines(m: Mission): LineRef[] {
  const speed = missionSpeed(m);
  const out: LineRef[] = [{ key: titleKey(m), tpl: m.titleSay, speed }];
  for (const [pageId, page] of Object.entries(m.pages)) {
    page.beats.forEach((b, i) => out.push({ key: beatKey(m, pageId, i), tpl: b.say, speed }));
    if (page.choice) {
      out.push({ key: choiceKey(m, pageId), tpl: page.choice.say, speed });
      page.choice.options.forEach((o, i) => out.push({ key: optionKey(m, pageId, i), tpl: o.say, speed }));
    }
  }
  return out;
}

export interface UiLine {
  id: string;
  say: string;
  speed?: number;
}

export function uiLines(list: UiLine[]): LineRef[] {
  return list.map((l) => ({ key: uiKey(l.id), tpl: l.say, speed: l.speed ?? DEFAULT_SPEED }));
}
