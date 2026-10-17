// A warm picture-book palette. Every colour in the app comes from here.

export const C = {
  // space
  space0: '#151a3f',
  space1: '#232a62',
  space2: '#33397a',
  star: '#fff6dc',
  sun: '#fff1b8',
  sunGlow: '#ffd27a',

  // earth
  ocean0: '#2f6fc0',
  ocean1: '#4b93dc',
  ocean2: '#6fb2ea',
  land0: '#7dbb6a',
  land1: '#a8cc72',
  sand: '#dcc48c',
  cloud: '#ffffff',
  atmos: '#a9dcff',
  nightOcean: '#17244f',
  nightLand: '#22305f',
  city: '#ffd36b',
  cityWhite: '#fff4d6',
  aurora: '#7ef0b4',
  aurora2: '#b4ffd8',
  dusk: '#ff9d6b',
  duskGold: '#ffcf6a',

  // moon
  moon: '#f3efe2',
  moonShade: '#d9d3c1',
  moonDark: '#2a3062',

  // station inside (day)
  wall0: '#f4ecdc',
  wall1: '#e9dfc9',
  wall2: '#dccfb4',
  wall3: '#c9b998',
  panelLine: '#cbbd9f',
  hatch: '#d7dde6',
  hatchDark: '#aeb7c6',
  metal: '#c7ced9',
  metalDark: '#98a2b3',
  rail: '#efb54a',
  railDark: '#cf9330',
  velcro: '#b9c2d6',
  cable: '#6f7a99',
  screen: '#2b3552',
  screenGlow: '#7fe3ff',
  bagBlue: '#5f8fd6',
  bagOrange: '#f29a5c',
  bagGreen: '#7fc49a',
  lamp: '#fff2c4',

  // station night tint
  night0: '#3a4170',
  night1: '#2e3562',
  night2: '#262c55',
  nightLine: '#4b5287',
  nightLamp: '#ffd58a',

  // garden
  growPink: '#f39ad6',
  growPurple: '#b98bf0',
  growRed: '#ff6f8f',
  growBlue: '#6f8cff',
  pillow: '#f6efe2',
  pillowShade: '#e2d6bf',
  leaf0: '#5fb85a',
  leaf1: '#86d16a',
  leaf2: '#3f9a52',
  leafRed: '#b8516a',
  petal: '#ff9a3c',
  petal2: '#ffb85c',
  water: '#7cc8ff',
  water2: '#bfe6ff',

  // button the robot
  bot0: '#8fdcc6',
  bot1: '#6cc5ad',
  bot2: '#4ea891',
  botScreen: '#22304d',
  botEye: '#8ff6ff',
  botTummy: '#ff9f43',
  botTummyGlow: '#ffd08a',
  botAntenna: '#ffcf5a',

  // party colours
  partyYellow: '#ffd75e',
  partyBlue: '#62b6ff',

  // ui
  ink: '#2b2a4a',
  inkSoft: '#5b5a7a',
  paper: '#fffaf0',
  paperShade: '#f1e7d3',
  coral: '#f07f6a',
  sunflower: '#f6c34f',
  sky: '#6fb2ea',
  mint: '#6fcf9a',
  lavender: '#a990e0',
  rose: '#ef8fb3',
  teal: '#3fb0b0',
  white: '#ffffff',
  shadow: 'rgba(30,30,70,0.18)',
} as const;

export const SKIN = ['#f9dcc6', '#f0c4a0', '#d9a274', '#b07850', '#7a4f33'] as const;
export const SKIN_SHADE = ['#efc3a6', '#e0aa82', '#c48a5d', '#97633f', '#634028'] as const;
export const HAIR = ['#2d2420', '#5a3a26', '#8a5a35', '#b0532c', '#e2b35b', '#c9c2b8'] as const;
export const SHIRT = [C.coral, C.sunflower, C.sky, C.mint, C.lavender, C.rose, C.teal] as const;

export function shade(hex: string, amt: number): string {
  // amt < 0 darkens, > 0 lightens
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  r = f(r); g = f(g); b = f(b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
