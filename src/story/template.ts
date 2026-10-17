// Name templates used in story lines. See docs/STORY_BIBLE.md.
//   {A} {T}  the chooser / tapper, spoken to ("Abigail, which way?")
//   {a} {t}  the chooser / tapper, in the story ("Abigail floated…")
//   {crew}   everyone in the crew
//   [two words|solo words]  picked by crew size

export type CastKey = 'NN' | 'NG' | 'GN' | 'GG' | 'SA' | 'ST' | 'SG';

export interface Cast {
  key: CastKey;
  two: boolean;
  A: string;
  T: string;
  a: string;
  t: string;
  crew: string;
}

export const BUILT_IN = { A: 'Abigail', T: 'Tommy' } as const;
const GEN = { A: 'Captain', T: 'Co-pilot', a: 'the Captain', t: 'the Co-pilot' };

function two(key: CastKey, aNamed: boolean, tNamed: boolean): Cast {
  const A = aNamed ? BUILT_IN.A : GEN.A;
  const T = tNamed ? BUILT_IN.T : GEN.T;
  const a = aNamed ? BUILT_IN.A : GEN.a;
  const t = tNamed ? BUILT_IN.T : GEN.t;
  return { key, two: true, A, T, a, t, crew: `${a} and ${t}` };
}

function solo(key: CastKey, name: string, third: string): Cast {
  return { key, two: false, A: name, T: name, a: third, t: third, crew: third };
}

export const CASTS: Record<CastKey, Cast> = {
  NN: two('NN', true, true),
  NG: two('NG', true, false),
  GN: two('GN', false, true),
  GG: two('GG', false, false),
  SA: solo('SA', BUILT_IN.A, BUILT_IN.A),
  ST: solo('ST', BUILT_IN.T, BUILT_IN.T),
  SG: solo('SG', GEN.A, GEN.a),
};

export const CAST_KEYS = Object.keys(CASTS) as CastKey[];

export interface CrewSettings {
  mode: 'two' | 'solo';
  /** in solo mode, which child is playing */
  soloWho: 'A' | 'T';
  names: { A: string; T: string };
}

const norm = (s: string) => s.trim().toLowerCase();

/** Which pre-recorded narration set fits these settings. */
export function castKeyFor(s: CrewSettings): CastKey {
  const aNamed = norm(s.names.A) === norm(BUILT_IN.A);
  const tNamed = norm(s.names.T) === norm(BUILT_IN.T);
  if (s.mode === 'solo') {
    if (s.soloWho === 'A') return aNamed ? 'SA' : 'SG';
    return tNamed ? 'ST' : 'SG';
  }
  if (aNamed && tNamed) return 'NN';
  if (aNamed) return 'NG';
  if (tNamed) return 'GN';
  return 'GG';
}

const TOKEN = /\{(A|T|a|t|crew)\}/g;
const ALT = /\[([^\[\]|]*)\|([^\[\]|]*)\]/g;

/** Capitalise "the Captain" / "the Co-pilot" at the start of a sentence. */
function capitalise(s: string): string {
  return s.replace(/(^|[.!?…]["”]?\s+|(?:^|\s)["“])the (Captain|Co-pilot)/g, '$1The $2');
}

export function renderLine(tpl: string, cast: Cast): string {
  const picked = tpl.replace(ALT, (_m, a: string, b: string) => (cast.two ? a : b));
  const filled = picked.replace(TOKEN, (_m, k: keyof Cast) => String(cast[k]));
  return capitalise(filled.replace(/\s{2,}/g, ' ').trim());
}

/** Text for labels and badges: shows the names the parent typed. */
export function renderDisplay(tpl: string, s: CrewSettings): string {
  const isTwo = s.mode === 'two';
  const soloName = s.soloWho === 'A' ? s.names.A : s.names.T;
  const A = isTwo ? s.names.A : soloName;
  const T = isTwo ? s.names.T : soloName;
  const vals: Record<string, string> = { A, T, a: A, t: T, crew: isTwo ? `${A} and ${T}` : soloName };
  return tpl
    .replace(ALT, (_m, a: string, b: string) => (isTwo ? a : b))
    .replace(TOKEN, (_m, k: string) => vals[k])
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Problems with a template string (for the story checker). */
export function templateProblems(tpl: string): string[] {
  const out: string[] = [];
  const stripped = tpl.replace(ALT, '').replace(TOKEN, '');
  if (/[\[\]|]/.test(stripped)) out.push('unbalanced [two|solo] alternation');
  if (/[{}]/.test(stripped)) out.push('unknown {token}');
  return out;
}
