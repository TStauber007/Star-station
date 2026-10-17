// Keepsake stickers for the station wall: one per finished mission.
import { C } from './palette.ts';
import { circle, ellipse, line, path, rect, sparklePath, starPath, svgDoc } from './svg.ts';
import { robotSvg } from './robot.ts';
import { placeSvg } from './flat.ts';
import { plantsSvg } from './props.ts';
import { moonSvg } from './sky.ts';

export const STICKERS = ['hello-button', 'garden-lettuce', 'garden-zinnia', 'sun-catcher', 'full-moon', 'flashlight', 'sleepy-star'] as const;

export const STICKER_NAMES: Record<string, string> = {
  'hello-button': 'Hello, Button',
  'garden-lettuce': 'Space lettuce',
  'garden-zinnia': 'Space zinnia',
  'sun-catcher': 'The Sun Catcher',
  'full-moon': 'The full Moon',
  'flashlight': 'Brave flashlight',
  'sleepy-star': 'Sleepy star',
};

let frameN = 0;
function frame(bgCol: string, inner: string): string {
  const id = `stk${frameN++}`;
  return svgDoc('0 0 240 240',
    `<defs><clipPath id="${id}"><circle cx="120" cy="120" r="96"/></clipPath></defs>` +
    circle(120, 126, 108, 'rgba(40,30,70,0.18)') +
    circle(120, 120, 108, C.white) + circle(120, 120, 96, bgCol) + `<g clip-path="url(#${id})">${inner}</g>` +
    path('M60 70 q30 -36 80 -40', 'none', 'stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.35"'));
}

export function stickerSvg(id: string): string {
  switch (id) {
    case 'hello-button':
      return frame('#cdeff0', placeSvg(robotSvg('wave'), 45, 40, 150, 175));
    case 'garden-lettuce':
      return frame('#f6c9ec', placeSvg(plantsSvg('lettuce', 3).replace('viewBox="0 0 460 360"', 'viewBox="135 150 190 180"'), 25, 40, 190, 180));
    case 'garden-zinnia':
      return frame('#f6c9ec', placeSvg(plantsSvg('zinnia', 3).replace('viewBox="0 0 460 360"', 'viewBox="160 90 140 230"'), 55, 20, 130, 210));
    case 'sun-catcher':
      return frame('#ffe6a8',
        circle(80, 80, 30, '#fff1b8') + circle(80, 80, 20, C.sunflower) +
        `<g transform="translate(140 130) rotate(-12)">` + rect(-58, -38, 116, 76, 8, '#3e5fae', 'stroke="#c4a454" stroke-width="6"') +
        line(-20, -34, -20, 34, '#7f9be0', 3) + line(20, -34, 20, 34, '#7f9be0', 3) + line(-54, 0, 54, 0, '#7f9be0', 3) + '</g>' +
        circle(170, 186, 9, '#5ee07a') + circle(170, 186, 18, '#5ee07a', 'opacity="0.3"'));
    case 'full-moon':
      return frame('#2b3270', moonSvg(120, 120, 62, 'full') + path(sparklePath(60, 60, 10), C.star) + path(sparklePath(186, 80, 8), C.star) + path(sparklePath(176, 184, 7), C.star));
    case 'flashlight':
      return frame('#3a4170', path('M120 120 L210 70 L210 180Z', '#fff3c2', 'opacity="0.45"') +
        `<g transform="rotate(-12 100 125)">` + rect(40, 105, 80, 40, 14, C.coral) + rect(112, 97, 22, 56, 8, C.metal) + circle(56, 125, 7, C.sunflower) + '</g>' +
        path(starPath(190, 125, 18), C.sunflower));
    case 'sleepy-star':
      return frame('#3b3560', path(starPath(120, 128, 70, 0.5), '#fff1a8') +
        path('M98 124 q8 8 16 0 M128 124 q8 8 16 0', 'none', `stroke="${C.ink}" stroke-width="4" stroke-linecap="round"`) +
        ellipse(120, 146, 7, 4, '#c96a6a') + path('M150 60 l30 -10 l-6 30z', '#8f7fd8') + circle(186, 46, 8, C.white) +
        `<text x="176" y="196" font-size="26" font-family="sans-serif" fill="#ffffff" opacity="0.8">z</text>`);
    default:
      return frame(C.sunflower, path(starPath(120, 120, 60), C.white));
  }
}

/** Resolve a mission's sticker id ("garden-$plant") with the story state. */
export function resolveSticker(id: string, state: Record<string, string>): string {
  return id.replace(/\$(\w+)/g, (_m, k) => state[k] ?? '');
}
