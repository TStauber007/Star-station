// Two big picture cards. The narrator reads each one while it glows.
import { h } from './dom.ts';

export class ChoiceOverlay {
  el: HTMLElement;
  private cards: HTMLButtonElement[] = [];
  private resolve: ((i: number) => void) | null = null;

  constructor() {
    this.el = h('div', { class: 'choice hidden' });
  }

  open(cards: { svg: string; label: string }[]) {
    this.el.innerHTML = '';
    const row = h('div', { class: 'choice-row' });
    this.cards = cards.map((c, i) => {
      const b = h('button', { class: 'card waiting', 'aria-label': c.label, disabled: true },
        h('div', { class: 'card-art', html: c.svg }),
        h('div', { class: 'card-label' }, c.label));
      b.addEventListener('click', () => this.pick(i));
      row.append(b);
      return b;
    });
    this.el.append(row);
    this.el.classList.remove('hidden');
    requestAnimationFrame(() => this.el.classList.add('open'));
  }

  glow(i: number | null) {
    this.cards.forEach((c, k) => c.classList.toggle('glow', k === i));
  }

  enable() {
    this.cards.forEach((c) => { c.disabled = false; c.classList.remove('waiting'); c.classList.add('ready'); });
  }

  wait(): Promise<number> {
    return new Promise((res) => { this.resolve = res; });
  }

  private pick(i: number) {
    if (!this.resolve) return;
    const r = this.resolve;
    this.resolve = null;
    this.cards.forEach((c, k) => { c.disabled = true; c.classList.add(k === i ? 'picked' : 'not-picked'); c.classList.remove('glow', 'ready'); });
    r(i);
  }

  close() {
    this.el.classList.remove('open');
    setTimeout(() => { this.el.classList.add('hidden'); this.el.innerHTML = ''; }, 450);
    this.resolve = null;
  }
}
