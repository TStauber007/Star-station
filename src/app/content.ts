// Story content and narration, bundled at build time.
import type { Mission, NarrationManifest } from '../story/types.ts';
import type { UiLine } from '../story/lines.ts';
import narration from '../generated/narration.json';
import uiLines from '../../content/ui-lines.json';

const files = import.meta.glob('../../content/missions/*.json', { eager: true, import: 'default' }) as Record<string, Mission>;

export const MISSIONS: Mission[] = Object.values(files).sort((a, b) => a.order - b.order);
export const UI_LINES = uiLines as UiLine[];
export const NARRATION = narration as unknown as NarrationManifest;

export function mission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
