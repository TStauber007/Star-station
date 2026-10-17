// Everything a mission file may name. The story checker uses this list.
import { CREW_POSES } from './crew.ts';
import { ROBOT_MOODS } from './robot.ts';
import { PLACES, TIMES } from './places.ts';
import { CARDS } from './cards.ts';

export const LIGHTS = ['on', 'off', 'yellow', 'blue', 'bedtime', 'bedtime-dim', 'garden-off'] as const;
export const MOONS = ['none', 'crescent', 'half', 'gibbous', 'full'] as const;

export const PROPS = [
  // hub
  'sock', 'sock-caught', 'sock-velcro', 'cupola-glow', 'window-sun', 'suncatcher-ok', 'suncatcher-wobbly',
  'suncatcher-fixed-off', 'suncatcher-wall', 'suncatcher-on', 'curtain', 'ball', 'tortillas', 'notes', 'bag',
  'table', 'spoon-bag', 'spoon-table', 'spoon-velcro', 'flashlight-on', 'drink-pouch', 'drawing',
  // dock
  'hatch-closed', 'hatch-open', 'boxes',
  // garden
  'plants-0', 'plants-seeded', 'plants-1', 'plants-2', 'plants-3', 'seed-packet-lettuce', 'seed-packet-zinnia',
  'pouch', 'water-ball', 'seed-peek', 'roots', 'harvest-lettuce', 'harvest-zinnia',
  // cupola, sleep, tunnel, outside
  'telescope', 'moon-chart', 'city-lights', 'aurora', 'count-stars', 'water-machine', 'wings-glint',
] as const;

/** Tommy "tap anything" effects. */
export const TAP_EFFECTS = [
  'wake', 'boop', 'hello', 'partylights', 'growlights', 'sparkle', 'bubbles', 'grow', 'sunbeams', 'spin',
  'bounce', 'charge', 'stars', 'moon', 'giggle', 'twinkle', 'sunset', 'sunrise', 'breeze', 'clink', 'dim',
] as const;

/** Hands-on moments with big tap targets. */
export const TARGETS = ['sock', 'pillows', 'pouch', 'panel', 'bolts', 'sprout', 'lens', 'moon-chart', 'spoon', 'count-stars'] as const;

export const SFX = [
  'chime', 'velcro', 'dingdong', 'hatch', 'whirl', 'song', 'boop', 'whoosh', 'blup', 'crunch', 'radio', 'bump',
  'wobble', 'swish', 'powerdown', 'click', 'hum', 'clink', 'gurgle', 'zip',
] as const;

const crewPoses = [...CREW_POSES, 'bed-$sleep'].filter((p) => p !== 'bed-$sleep');

export const VOCAB: Record<string, readonly string[]> = {
  place: PLACES,
  time: TIMES,
  lights: LIGHTS,
  crew: crewPoses,
  robot: ROBOT_MOODS,
  moon: MOONS,
  props: PROPS,
  card: CARDS,
  tap: TAP_EFFECTS,
  targets: TARGETS,
  sfx: SFX,
};
