// The grown-ups page. Everything here is stored only on this tablet.
import { HAIR_STYLES, kidFaceSvg, kidSvg, type Who } from '../art/crew.ts';
import { HAIR, SHIRT, SKIN } from '../art/palette.ts';
import { MISSIONS } from '../app/content.ts';
import { load, update, isLocked, type Settings } from '../app/settings.ts';
import { BUILT_IN } from '../story/template.ts';
import { audio } from '../audio/engine.ts';
import { playSfx } from '../audio/sfx.ts';
import { h, holdButton } from './dom.ts';
import { icon } from './icons.ts';
import sourcesMd from '../../docs/SCIENCE_SOURCES.md?raw';

const ROLE: Record<Who, string> = { A: 'Older child — makes the story choices', T: 'Younger child — the "tap anything" moments' };
const GENERIC: Record<Who, string> = { A: 'Captain', T: 'Co-pilot' };

function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/** A very small Markdown subset. Links become plain text: no outbound links in this app. */
export function miniMarkdown(md: string): string {
  const inline = (t: string) => esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 <span class="url">$2</span>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  const out: string[] = [];
  let list = false;
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    const li = /^\s*[-*] (.*)$/.exec(line);
    if (li) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(li[1])}</li>`); continue; }
    if (list) { out.push('</ul>'); list = false; }
    if (/^---+$/.test(line)) continue;
    const hd = /^(#{1,3}) (.*)$/.exec(line);
    if (hd) { out.push(`<h${hd[1].length + 2}>${inline(hd[2])}</h${hd[1].length + 2}>`); continue; }
    if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push('</ul>');
  return out.join('');
}

function swatches(colors: readonly string[], current: number, onPick: (i: number) => void, label: string): HTMLElement {
  const row = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': label });
  colors.forEach((c, i) => {
    const b = h('button', { class: `swatch${i === current ? ' on' : ''}`, style: `background:${c}`, role: 'radio', 'aria-checked': String(i === current), 'aria-label': `${label} ${i + 1}` });
    b.addEventListener('click', () => { onPick(i); row.querySelectorAll('.swatch').forEach((x, k) => { x.classList.toggle('on', k === i); x.setAttribute('aria-checked', String(k === i)); }); });
    row.append(b);
  });
  return row;
}

function toggle(label: string, on: boolean, onChange: (v: boolean) => void, note?: string): HTMLElement {
  const input = h('input', { type: 'checkbox', checked: on }) as HTMLInputElement;
  input.addEventListener('change', () => onChange(input.checked));
  return h('label', { class: 'toggle' }, input, h('span', { class: 'slider' }), h('span', { class: 'toggle-text' }, h('strong', {}, label), note ? h('small', {}, note) : null));
}

function slider(label: string, value: number, onChange: (v: number) => void): HTMLElement {
  const input = h('input', { type: 'range', min: 0, max: 100, value: Math.round(value * 100) }) as HTMLInputElement;
  input.addEventListener('input', () => onChange(Number(input.value) / 100));
  input.addEventListener('change', () => playSfx('chime'));
  return h('label', { class: 'range' }, h('span', {}, label), input);
}

function childEditor(who: Who, s: Settings): HTMLElement {
  const preview = h('div', { class: 'avatar-preview', html: kidSvg(who, s.avatars[who], 'wave') });
  const refresh = () => { preview.innerHTML = kidSvg(who, load().avatars[who], 'wave'); };
  const setAv = (fn: (a: Settings['avatars'][Who]) => void) => { update((x) => fn(x.avatars[who])); refresh(); };
  const name = h('input', { type: 'text', value: s.names[who], maxlength: 20, autocomplete: 'off', 'aria-label': `Name for the ${who === 'A' ? 'older' : 'younger'} child` }) as HTMLInputElement;
  const note = h('small', { class: 'name-note' });
  const showNote = () => {
    const changed = name.value.trim().toLowerCase() !== BUILT_IN[who].toLowerCase();
    note.textContent = changed
      ? `The voice will say "${GENERIC[who]}" for this child, and the screen will show "${name.value.trim() || BUILT_IN[who]}".`
      : `The voice says "${BUILT_IN[who]}" by name.`;
  };
  name.addEventListener('input', () => { update((x) => { x.names[who] = name.value.trim() || BUILT_IN[who]; }); showNote(); });
  showNote();
  const hair = h('div', { class: 'hair-styles', role: 'radiogroup', 'aria-label': 'Hair style' });
  HAIR_STYLES.forEach((st) => {
    const b = h('button', { class: `hair-pick${s.avatars[who].hair === st ? ' on' : ''}`, 'aria-label': `Hair: ${st}`, html: kidFaceSvg(who, { ...s.avatars[who], hair: st }) });
    b.addEventListener('click', () => { setAv((a) => { a.hair = st; }); hair.querySelectorAll('.hair-pick').forEach((x) => x.classList.toggle('on', x === b)); });
    hair.append(b);
  });
  const reset = h('button', { class: 'pill small', 'aria-label': `Use the name ${BUILT_IN[who]}` }, `Use "${BUILT_IN[who]}"`);
  reset.addEventListener('click', () => { name.value = BUILT_IN[who]; update((x) => { x.names[who] = BUILT_IN[who]; }); showNote(); });
  return h('div', { class: 'child' },
    h('div', { class: 'child-head' }, preview, h('div', { class: 'child-name' }, h('small', {}, ROLE[who]), name, note, reset)),
    h('div', { class: 'picker' }, h('span', {}, 'Skin'), swatches(SKIN, s.avatars[who].skin, (i) => setAv((a) => { a.skin = i; }), 'Skin tone')),
    h('div', { class: 'picker' }, h('span', {}, 'Hair'), hair),
    h('div', { class: 'picker' }, h('span', {}, 'Hair colour'), swatches(HAIR, s.avatars[who].hairColor, (i) => setAv((a) => { a.hairColor = i; }), 'Hair colour')),
    h('div', { class: 'picker' }, h('span', {}, 'Shirt'), swatches(SHIRT, s.avatars[who].shirt, (i) => setAv((a) => { a.shirt = i; }), 'Shirt colour')));
}

export function parentScreen(onDone: () => void): { el: HTMLElement; destroy(): void } {
  const s = load();
  const done = h('button', { class: 'pill done', 'aria-label': 'Done' }, h('span', { html: icon('check') }), h('span', {}, 'Done'));
  done.addEventListener('click', onDone);

  // crew mode
  const soloRow = h('div', { class: 'solo-who' });
  const renderSolo = () => {
    const cur = load();
    soloRow.innerHTML = '';
    if (cur.crew !== 'solo') return;
    soloRow.append(h('span', {}, 'Who is playing?'));
    (['A', 'T'] as Who[]).forEach((w) => {
      const b = h('button', { class: `seg${cur.soloWho === w ? ' on' : ''}` }, cur.names[w]);
      b.addEventListener('click', () => { update((x) => { x.soloWho = w; }); renderSolo(); });
      soloRow.append(b);
    });
  };
  const seg = (label: string, val: 'two' | 'solo') => {
    const b = h('button', { class: `seg${s.crew === val ? ' on' : ''}`, 'data-val': val }, label);
    b.addEventListener('click', () => { update((x) => { x.crew = val; }); modeRow.querySelectorAll('.seg').forEach((x) => x.classList.toggle('on', (x as HTMLElement).dataset.val === val)); renderSolo(); });
    return b;
  };
  const modeRow = h('div', { class: 'segments' }, seg('Two crew', 'two'), seg('One crew', 'solo'));
  renderSolo();

  // calm
  const lockNote = h('div', { class: 'lock-note' });
  const renderLock = () => {
    lockNote.innerHTML = '';
    const cur = load();
    if (isLocked(cur)) {
      const b = h('button', { class: 'pill small' }, 'Lights back on now');
      b.addEventListener('click', () => { update((x) => { x.lockedAt = null; }); renderLock(); });
      lockNote.append(h('span', {}, 'Lights are out right now. '), b);
    }
  };
  renderLock();

  const clearBtn = h('button', { class: 'pill small hold' }, h('span', { class: 'ring' }), h('span', {}, 'Hold to clear the sticker wall'));
  holdButton(clearBtn, 2000, () => { update((x) => { x.stickers = {}; }); clearBtn.querySelector('span:last-child')!.textContent = 'Sticker wall cleared'; });

  const missions = h('div', { class: 'mission-notes' }, ...MISSIONS.map((m) => h('details', { class: 'mnote' },
    h('summary', {}, h('span', { class: 'mnote-num' }, String(m.order)), h('span', {}, m.title), h('small', {}, m.parent.virtue)),
    h('p', {}, m.parent.summary),
    h('h4', {}, 'What it teaches'),
    h('p', {}, h('strong', {}, 'Virtue: '), m.parent.virtue),
    h('ul', {}, ...m.parent.science.map((x) => h('li', {}, x))),
    h('h4', {}, 'What each choice shows'),
    h('ul', {}, ...m.parent.paths.map((p) => h('li', {}, h('strong', {}, `${p.moment}. `), p.options.join(' ')))),
    h('h4', {}, 'Talk about it afterwards'),
    h('ul', {}, ...m.parent.talk.map((q) => h('li', {}, q))))));

  const el = h('div', { class: 'screen parent' },
    h('header', { class: 'parent-head' }, h('h1', {}, 'For grown-ups'), done),
    h('div', { class: 'parent-body' },
      h('section', {}, h('h2', {}, 'The crew'),
        h('p', {}, 'Two crew: the older child makes the story choices and the younger one has "tap anything" moments. The narrator calls each by name. One crew: one child does everything.'),
        modeRow, soloRow, childEditor('A', s), childEditor('T', s)),
      h('section', {}, h('h2', {}, 'Sound and words'),
        slider('Voice', s.volume.narration, (v) => { update((x) => { x.volume.narration = v; }); audio.setVolumes(load().volume); }),
        slider('Music', s.volume.music, (v) => { update((x) => { x.volume.music = v; }); audio.setVolumes(load().volume); }),
        slider('Sound effects', s.volume.sfx, (v) => { update((x) => { x.volume.sfx = v; }); audio.setVolumes(load().volume); }),
        toggle('Show the words', s.captions, (v) => update((x) => { x.captions = v; }), 'Words appear at the bottom and light up as they are read.')),
      h('section', {}, h('h2', {}, 'Calm'),
        toggle('One mission, then lights out', s.lightsOut, (v) => update((x) => { x.lightsOut = v; if (!v) x.lockedAt = null; }),
          'After one mission the station goes to sleep. Another mission needs a grown-up to hold the button for 3 seconds (or it wakes by itself after 6 hours).'),
        lockNote,
        h('p', { class: 'muted' }, 'There are no points, timers, streaks or reminders. Missions never play one after another by themselves.'),
        clearBtn),
      h('section', {}, h('h2', {}, 'The missions'), h('p', {}, 'What each story teaches, what each choice shows, and questions to talk about afterwards.'), missions),
      h('section', { class: 'sources' }, h('h2', {}, 'Science sources'), h('div', { html: miniMarkdown(sourcesMd.replace(/^# .*\n/, '')) })),
      h('section', {}, h('h2', {}, 'Privacy'),
        h('p', {}, 'Star Station has no accounts, ads, analytics, chat or links out. It never connects to the internet once installed. Names, pictures and stickers are saved only on this tablet.'),
        h('p', { class: 'muted' }, 'Narration was recorded in advance with the open Kokoro-82M voice. All pictures, music and sounds are made by the app itself.'))));
  return { el, destroy() {} };
}
