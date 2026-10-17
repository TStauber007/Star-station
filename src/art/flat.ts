// Flattens a composed scene into one SVG string (for covers and previews).
import type { Scene } from './compose.ts';
import { f } from './svg.ts';
import { C } from './palette.ts';

export function placeSvg(svg: string, x: number, y: number, w: number, h: number): string {
  return svg.replace('<svg ', `<svg x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" preserveAspectRatio="xMidYMid meet" `);
}

export function sceneToSvg(scene: Scene, W: number, opts: { top?: number; height?: number } = {}): string {
  const top = opts.top ?? 0, height = opts.height ?? 1000;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-W / 2)} ${f(top)} ${f(W)} ${f(height)}" preserveAspectRatio="xMidYMid slice">`;
  s += scene.layers.back;
  for (const t of scene.layers.twinkles) s += `<circle cx="${f(t.x)}" cy="${f(t.y)}" r="${f(t.r * 0.6)}" fill="${C.star}"/>`;
  s += scene.layers.room;
  for (const a of [...scene.actors].sort((p, q) => p.z - q.z)) {
    const tr = `translate(${f(a.x)} ${f(a.y)})${a.rot ? ` rotate(${f(a.rot)})` : ''}${a.flip ? ' scale(-1 1)' : ''}`;
    s += `<g transform="${tr}">${placeSvg(a.svg, -a.w / 2, -a.h / 2, a.w, a.h)}</g>`;
  }
  if (scene.layers.wash) s += `<rect x="-1300" y="-100" width="2600" height="1200" fill="${scene.layers.wash.color}" opacity="${scene.layers.wash.opacity}"/>`;
  return s + '</svg>';
}
