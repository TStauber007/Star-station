// A clock that stops while the story is paused.
let pausedAt: number | null = null;
let pausedTotal = 0;
const waiters = new Set<() => void>();

export const clock = {
  /** QA: make every wait tiny */
  fast: false,
  now(): number {
    const t = performance.now();
    return (pausedAt ?? t) - pausedTotal;
  },
  get paused() { return pausedAt !== null; },
  pause() { if (pausedAt === null) pausedAt = performance.now(); },
  resume() {
    if (pausedAt === null) return;
    pausedTotal += performance.now() - pausedAt;
    pausedAt = null;
    waiters.forEach((w) => w());
  },
  /** wait `ms` of story time */
  wait(ms: number, signal?: { cancelled: boolean }): Promise<void> {
    if (clock.fast) ms = Math.min(ms, 10);
    const end = clock.now() + ms;
    return new Promise((resolve) => {
      const check = () => {
        if (signal?.cancelled) return resolve();
        if (clock.now() >= end) return resolve();
        setTimeout(check, Math.min(80, Math.max(10, end - clock.now())));
      };
      check();
    });
  },
  /** resolves when not paused */
  whenRunning(): Promise<void> {
    if (pausedAt === null) return Promise.resolve();
    return new Promise((resolve) => {
      const w = () => { waiters.delete(w); resolve(); };
      waiters.add(w);
    });
  },
};
