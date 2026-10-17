// Turns a page's art description into layers and actors for the stage.
import type { SceneArt, StateValues } from '../story/types.ts';
import { CREW_SCALE, kidInBagSvg, kidSvg, type Avatar, type Who } from './crew.ts';
import { robotSvg } from './robot.ts';
import { placeLayers, type PlaceLayers } from './places.ts';
import { blanketSvg, boxSvg, glowStarSvg, GLOW_STARS, plantsSvg, propSpec, stationSvg, type PlantKind } from './props.ts';
import type { MoonPhase } from './sky.ts';

export interface Actor {
  id: string;
  svg: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  anim?: string;
  rot?: number;
  flip?: boolean;
  /** tap targets in design units, absolute */
  hits?: { x: number; y: number; r: number; taps: number }[];
  target?: string;
}

export interface Scene {
  layers: PlaceLayers;
  actors: Actor[];
  placeKey: string;
}

export interface ComposeCtx {
  W: number;
  state: StateValues;
  avatars: Record<Who, Avatar>;
  crew: 'two' | 'solo';
  soloWho: Who;
  bedtime: boolean;
}

export const half = (W: number) => Math.min(W / 2, 680);

/** Resolve "$var" references against the story state. */
export function resolveArt(art: SceneArt, state: StateValues): SceneArt {
  const sub = (v: string) => v.replace(/\$(\w+)/g, (_m, k) => state[k] ?? '');
  return {
    ...art,
    crew: art.crew && sub(art.crew),
    robot: art.robot && sub(art.robot),
    lights: art.lights && sub(art.lights),
    moon: art.moon && sub(art.moon),
    time: art.time && sub(art.time),
    props: art.props?.map(sub),
  };
}

const MOON_FILL: Record<string, number> = { none: 0, crescent: 1, half: 2, gibbous: 3, full: 4 };

// where the crew and Button float, per place: [fx, y]
const SLOTS: Record<string, { A: [number, number]; T: [number, number]; R: [number, number] }> = {
  hub: { A: [-0.44, 520], T: [0.02, 600], R: [0.5, 470] },
  dock: { A: [-0.5, 540], T: [-0.12, 610], R: [0.42, 520] },
  garden: { A: [-0.56, 560], T: [-0.24, 640], R: [0.6, 560] },
  cupola: { A: [-0.48, 650], T: [-0.08, 720], R: [0.3, 640] },
  sleep: { A: [-0.48, 540], T: [-0.08, 570], R: [0.5, 640] },
  tunnel: { A: [-0.58, 560], T: [0.02, 610], R: [-0.28, 500] },
  orbit: { A: [-0.3, 600], T: [0, 620], R: [0.3, 600] },
};

const KID_BOX = { w: 300, h: 420 };
/** overall size of the crew and Button on stage */
export const ACTOR_SCALE = 1.28;
const BOT_BOX = { w: 240, h: 280 };

export function composeScene(rawArt: SceneArt, ctx: ComposeCtx): Scene {
  const art = resolveArt(rawArt, ctx.state);
  const place = art.place ?? 'hub';
  const time = art.time ?? (place === 'sleep' ? 'night' : 'day');
  const lights = art.lights ?? (ctx.bedtime ? 'bedtime' : 'on');
  const props = new Set(art.props ?? []);
  const moon = (art.moon ?? 'none') as MoonPhase;
  const H = half(ctx.W);
  const X = (fx: number) => fx * H;
  const layers = placeLayers(place, { W: ctx.W, time, lights, moon, props, bedtime: ctx.bedtime });
  const actors: Actor[] = [];
  const plant = (ctx.state.plant as PlantKind) || 'lettuce';

  // ---- the station itself, seen from outside
  if (place === 'orbit') {
    const sw = Math.min(1100, ctx.W * 1.12);
    const m = /^wake:(\d+)$/.exec(lights);
    const svg = m ? stationSvg('on', Number(m[1])) : stationSvg(lights === 'off' ? 'off' : 'on');
    actors.push({ id: 'station', svg, x: 0, y: 400, w: sw, h: sw * 0.46, z: 10, anim: 'bob-slow', target: 'station' });
  }

  // ---- props
  for (const name of props) {
    if (name === 'boxes') {
      [[-210, 520, 1], [190, 600, 2], [70, 300, 3], [-120, 330, 4]].forEach(([ax, y, seed], i) =>
        actors.push({ id: `box${i}`, svg: boxSvg(seed), x: ax, y, w: 140, h: 120, z: i === 1 ? 26 : 12, anim: i % 2 ? 'drift' : 'drift2', rot: (i - 1.5) * 8 }));
      continue;
    }
    if (name === 'count-stars') {
      GLOW_STARS.forEach(([fx, y], i) => actors.push({ id: `gstar${i}`, svg: glowStarSvg(), x: X(fx), y, w: 104, h: 104, z: 4, anim: 'glowstar', hits: [{ x: X(fx), y, r: 58, taps: 1 }], target: 'count-stars' }));
      continue;
    }
    const pm = /^plants-(\d|seeded)$/.exec(name);
    if (pm) {
      const stage = pm[1] === 'seeded' ? 0 : Number(pm[1]);
      const svg = plantsSvg(plant, stage, { seeded: pm[1] === 'seeded', roots: props.has('roots') });
      actors.push({
        id: 'plants', svg, x: 0, y: 430, w: 460, h: 360, z: 3,
        hits: [-130, 0, 130].map((dx) => ({ x: dx, y: 430 + 72, r: 64, taps: 1 })), target: 'pillows',
      });
      continue;
    }
    if (name === 'roots' || name === 'city-lights' || name === 'aurora' || name === 'cupola-glow' || name === 'hatch-open' || name === 'hatch-closed' || name === 'wings-glint') continue;
    const spec = propSpec(name, { place, plant, moonFill: MOON_FILL[moon] ?? 0, bedtime: ctx.bedtime });
    if (!spec || !spec.svg) continue;
    const x = spec.ax ?? X(spec.fx ?? 0);
    const id = name.startsWith('suncatcher') ? 'suncatcher' : name.startsWith('spoon') ? 'spoon' : name.startsWith('seed-packet') ? 'seed-packet' : `prop:${name}`;
    actors.push({
      id, svg: spec.svg, x, y: spec.y, w: spec.w, h: spec.h, z: spec.z ?? 20, anim: spec.anim, rot: spec.rot,
      hits: spec.targets?.map((t) => ({ x: x + t.dx, y: spec.y + t.dy, r: t.r, taps: t.taps ?? 1 })),
      target: spec.target,
    });
  }
  // bolts on the wobbly Sun Catcher (a second set of targets on the same prop)
  const sc = actors.find((a) => a.id === 'suncatcher');
  if (sc && props.has('suncatcher-wobbly')) {
    const k = sc.w / 240;
    (sc as any).bolts = [[44, 34], [196, 34], [120, 128]].map(([bx, by]) => ({ x: sc.x + (bx - 120) * k, y: sc.y + (by - 115) * k, r: 58, taps: 1 }));
  }
  if (sc && props.has('suncatcher-on')) sc.anim = 'glow-soft';

  // ---- the crew
  const crewPose = art.crew ?? (place === 'orbit' ? 'none' : 'float');
  let slots = SLOTS[place] ?? SLOTS.hub;
  // make room by the Sun Catcher on the left wall
  const byPanel = [...props].some((p) => p === 'window-sun' || p.startsWith('suncatcher') || p === 'curtain');
  if (byPanel && (place === 'hub')) slots = { A: [0.12, 520], T: [0.44, 610], R: [0.66, 470] };
  // the telescope: whoever is looking stands at the eyepiece
  const scopeX = 0.62;
  const eyepiece = (H2: number) => scopeX * H2 - 150;
  const who: Who[] = ctx.crew === 'two' ? ['A', 'T'] : [ctx.soloWho];
  const robotMood = art.robot ?? (place === 'orbit' ? 'none' : 'happy');

  if (crewPose === 'blanket') {
    const n = who.length + (robotMood === 'blanket' ? 1 : 0);
    actors.push({ id: 'blanket', svg: blanketSvg(n), x: X(-0.1), y: 600, w: 520, h: 300, z: 25, anim: 'breathe' });
  } else if (crewPose !== 'none') {
    for (const w of who) {
      const solo = who.length === 1;
      let [fx, y] = solo ? [(slots.A[0] + slots.T[0]) / 2, (slots.A[1] + slots.T[1]) / 2] : slots[w];
      let pose = crewPose;
      let scale = CREW_SCALE[w] * 0.95 * ACTOR_SCALE;
      let flip = false;
      let anim = w === 'A' ? 'bob' : 'bob2';
      let rot = 0;
      const isBed = pose.startsWith('bed');
      if (pose === 'hold') {
        if (solo) { fx = -0.36; }
        else if (w === 'A') fx = -0.46; else { fx = 0.42; flip = true; }
        if (!solo && w === 'T') { y = slots.A[1] + 60; }
      }
      if (pose === 'zoom') { fx = w === 'A' ? -0.1 : 0.12; y = 410; scale *= 0.62; anim = 'none'; }
      if (pose === 'worry' && rawArt.robot === 'sad') { fx = w === 'A' ? -0.08 : 0.16; y = 440; scale *= 0.72; }
      if (pose === 'tumble') anim = 'spin-slow';
      if (pose === 'telescope') {
        const atScope = solo || w === 'T';
        if (atScope) { fx = eyepiece(H) / H; y = 730; pose = 'telescope'; flip = false; }
        else { pose = 'look'; fx = solo ? fx : -0.5; }
      }
      if (pose === 'squish') { fx = w === 'A' ? 0.3 : 0.48; y = w === 'A' ? 560 : 620; rot = w === 'A' ? 12 : -10; anim = 'wobble'; }
      if (isBed) {
        const upside = pose === 'bed-down';
        const asleep = lights === 'off';
        const svg = kidInBagSvg(w, ctx.avatars[w], { upside, asleep });
        actors.push({ id: w, svg, x: X(fx), y, w: KID_BOX.w * scale, h: KID_BOX.h * scale, z: w === 'T' ? 22 : 21, anim: 'breathe' });
        continue;
      }
      const svg = kidSvg(w, ctx.avatars[w], pose);
      actors.push({ id: w, svg, x: X(fx), y, w: KID_BOX.w * scale, h: KID_BOX.h * scale, z: w === 'T' ? 22 : 21, anim, flip, rot });
    }
  }

  // ---- Button
  if (robotMood !== 'none' && robotMood !== 'hidden' && robotMood !== 'blanket') {
    let [fx, y] = slots.R;
    let x = X(fx);
    const scale = 0.86 * ACTOR_SCALE;
    let anim = 'bob3';
    let z = 23;
    if (place === 'dock') { x = 190; y = 540; }
    if (robotMood === 'peek') { z = 25; y += 30; anim = 'peek'; }
    if (crewPose === 'hold') { x = X(ctx.crew === 'two' ? -0.02 : 0.12); y = (slots.A[1] + 40); }
    if (robotMood === 'sad' && crewPose === 'zoom') { x = X(-0.5); y = 560; }
    if (robotMood === 'sad' && crewPose === 'worry') { x = X(-0.52); y = 560; }
    if (robotMood === 'spin' || robotMood === 'dance') anim = 'spin-slow';
    if (robotMood === 'giggle') anim = 'giggle';
    if (robotMood === 'scared') anim = 'shiver';
    if (robotMood === 'telescope') { x = eyepiece(H) + 10; y = 670; }
    else if (crewPose === 'telescope') { x = X(-0.06); y = 560; }
    if (robotMood === 'wait') { x = X(-0.06); y = 520; }
    if (robotMood === 'squish') { x = X(0.62); y = 540; anim = 'wobble'; }
    if (robotMood === 'charge') { x = X(-0.3); y = 520; }
    if (robotMood === 'fix') { x = X(-0.3); y = 470; }
    if (place === 'sleep') { anim = 'breathe'; }
    if (place === 'tunnel') { x = X(-0.28); }
    actors.push({ id: 'robot', svg: robotSvg(robotMood), x, y, w: BOT_BOX.w * scale, h: BOT_BOX.h * scale, z, anim });
    // a zinnia tucked behind the antenna
    if (props.has('harvest-zinnia')) {
      const fl = actors.find((a) => a.id === 'prop:harvest-zinnia');
      if (fl) { fl.x = x + 46; fl.y = y - 120; }
    }
  }
  // Button hides behind the big box at the dock
  if (place === 'dock' && (robotMood === 'peek' || robotMood === 'hidden')) {
    const box = actors.find((a) => a.id === 'box1');
    if (box) box.z = 30;
  }
  return { layers, actors, placeKey: `${place}|${time}|${lights}|${moon}|${[...props].filter((p) => ['cupola-glow', 'hatch-open', 'hatch-closed', 'aurora', 'roots'].includes(p)).join(',')}` };
}
