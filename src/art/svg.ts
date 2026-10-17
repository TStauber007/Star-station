// Tiny helpers for writing SVG as strings.

export const f = (n: number) => (Math.round(n * 10) / 10).toString();

export function svgDoc(viewBox: string, inner: string, extra = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${extra}>${inner}</svg>`;
}

export function circle(cx: number, cy: number, r: number, fill: string, extra = ''): string {
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
}

export function ellipse(cx: number, cy: number, rx: number, ry: number, fill: string, extra = ''): string {
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
}

export function rect(x: number, y: number, w: number, h: number, rx: number, fill: string, extra = ''): string {
  return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rx)}" fill="${fill}" ${extra}/>`;
}

export function path(d: string, fill: string, extra = ''): string {
  return `<path d="${d}" fill="${fill}" ${extra}/>`;
}

export function line(x1: number, y1: number, x2: number, y2: number, stroke: string, w: number, extra = ''): string {
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${f(w)}" stroke-linecap="round" ${extra}/>`;
}

export function poly(pts: [number, number][], fill: string, extra = ''): string {
  return `<polygon points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}" fill="${fill}" ${extra}/>`;
}

export function g(inner: string, extra = ''): string {
  return `<g ${extra}>${inner}</g>`;
}

/** A soft 5-point star path centred on (cx, cy). */
export function starPath(cx: number, cy: number, r: number, inner = 0.48): string {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * inner;
    d += `${i === 0 ? 'M' : 'L'}${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)} `;
  }
  return d + 'Z';
}

/** A tiny 4-point twinkle. */
export function sparklePath(cx: number, cy: number, r: number): string {
  const q = r * 0.22;
  return `M${f(cx)} ${f(cy - r)} Q${f(cx + q)} ${f(cy - q)} ${f(cx + r)} ${f(cy)} Q${f(cx + q)} ${f(cy + q)} ${f(cx)} ${f(cy + r)} Q${f(cx - q)} ${f(cy + q)} ${f(cx - r)} ${f(cy)} Q${f(cx - q)} ${f(cy - q)} ${f(cx)} ${f(cy - r)}Z`;
}

/** Deterministic pseudo-random numbers, so drawings never change between runs. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return (s % 100000) / 100000;
  };
}

let uid = 0;
/** Unique ids for gradients inside inline SVGs. */
export const nid = (p: string) => `${p}${(uid++).toString(36)}`;
