// "Whose turn": the child's face and name, so turn-taking is visible.
import { h } from './dom.ts';
import { kidFaceSvg, type Avatar, type Who } from '../art/crew.ts';

export class TurnBadge {
  el: HTMLElement;
  constructor() {
    this.el = h('div', { class: 'turn hidden', 'aria-live': 'polite' });
  }
  show(who: Who, avatar: Avatar, name: string, side: 'left' | 'right') {
    this.el.innerHTML = '';
    this.el.append(h('div', { class: 'turn-face', html: kidFaceSvg(who, avatar, 'happy', 'grin') }), h('div', { class: 'turn-name' }, name));
    this.el.className = `turn ${side}`;
  }
  hide() { this.el.classList.add('hidden'); }
}
