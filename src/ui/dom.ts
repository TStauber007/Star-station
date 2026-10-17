// Tiny DOM helpers. No framework.
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | undefined> = {},
  ...kids: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids) if (kid !== null && kid !== undefined) el.append(kid);
  return el;
}

export function svgEl(markup: string): Element {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild as Element;
}

export function clear(el: Element) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/** A button that only fires after being held for `ms` (for grown-ups). */
export function holdButton(el: HTMLElement, ms: number, onDone: () => void, onProgress?: (p: number) => void) {
  let t0 = 0, raf = 0, active = false;
  const tick = () => {
    if (!active) return;
    const p = Math.min(1, (performance.now() - t0) / ms);
    onProgress?.(p);
    el.style.setProperty('--hold', String(p));
    if (p >= 1) { active = false; el.style.setProperty('--hold', '0'); onDone(); return; }
    raf = requestAnimationFrame(tick);
  };
  const start = (e: Event) => { e.preventDefault(); active = true; t0 = performance.now(); raf = requestAnimationFrame(tick); };
  const stop = () => { active = false; cancelAnimationFrame(raf); el.style.setProperty('--hold', '0'); onProgress?.(0); };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointerleave', stop);
  el.addEventListener('pointercancel', stop);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter' && !active) start(e); });
  el.addEventListener('keyup', stop);
}

export const sleepMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
