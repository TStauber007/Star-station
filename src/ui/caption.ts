// The caption box: big friendly words, highlighted as they're read.
import { h, clear } from './dom.ts';

export class Caption {
  el: HTMLElement;
  private inner: HTMLElement;
  private spans: HTMLElement[] = [];
  private current = -1;
  visible = true;

  constructor() {
    this.inner = h('p', { class: 'caption-text', 'aria-live': 'polite' });
    this.el = h('div', { class: 'caption hidden' }, this.inner);
  }

  show(words: string[]) {
    clear(this.inner);
    this.spans = words.map((w) => h('span', { class: 'w' }, w));
    this.spans.forEach((s, i) => { this.inner.append(s); if (i < this.spans.length - 1) this.inner.append(' '); });
    this.current = -1;
    this.el.classList.toggle('hidden', !this.visible || words.length === 0);
  }

  highlight(i: number) {
    if (i === this.current) return;
    if (this.current >= 0) this.spans[this.current]?.classList.remove('on');
    this.current = i;
    if (i >= 0) {
      this.spans[i]?.classList.add('on');
      for (let k = 0; k < i; k++) this.spans[k].classList.add('read');
    }
  }

  finish() {
    if (this.current >= 0) this.spans[this.current]?.classList.remove('on');
    this.spans.forEach((s) => s.classList.add('read'));
    this.current = -1;
  }

  hide() { this.el.classList.add('hidden'); }

  setVisible(v: boolean) {
    this.visible = v;
    if (!v) this.el.classList.add('hidden');
  }
}
