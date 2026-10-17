// Simple rounded icons for buttons.
const P: Record<string, string> = {
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/>',
  replay: '<path d="M5 12a7 7 0 1 0 2.1-5"/><path d="M4 4v4.5h4.5"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
  next: '<path d="M5 12h13"/><path d="M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H6"/><path d="M11 6l-6 6 6 6"/>',
  wall: '<circle cx="7.5" cy="7.5" r="3"/><circle cx="16.5" cy="7.5" r="3"/><circle cx="7.5" cy="16.5" r="3"/><path d="M16.5 13.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="currentColor"/>',
  go: '<path d="M12 3c3 2 4.5 5.5 4.5 9.5L15 15H9l-1.5-2.5C7.5 8.5 9 5 12 3z"/><circle cx="12" cy="9.5" r="1.6"/><path d="M9 15l-2 4 3-1M15 15l2 4-3-1"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z"/>',
  grown: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.5-3.5 2.6-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="17" cy="10" r="2.2"/><path d="M14.8 19c.3-2.5 1.2-4 3.2-4.2"/>',
  star: '<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
};

export function icon(name: string): string {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] ?? ''}</svg>`;
}
