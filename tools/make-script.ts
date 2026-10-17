// Writes docs/SCRIPT.md: every mission as a readable script.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import type { Mission } from '../src/story/types.ts';
import { CASTS, renderLine } from '../src/story/template.ts';

const ms = readdirSync('content/missions').map((f) => JSON.parse(readFileSync('content/missions/' + f, 'utf8')) as Mission).sort((a, b) => a.order - b.order);
const say = (t: string) => renderLine(t, CASTS.NN);
let out = `# Star Station — the full script

Every line the narrator reads, mission by mission, as heard with the built-in names (Abigail and Tommy). With one child, or with other names, the same lines are read with that child's name or with "Captain" / "Co-pilot".

Notes in *italics* say what happens on screen. **Choice** pages show two picture cards; the page each card leads to is in brackets. Lines marked *(only if …)* play only on some paths.

`;
for (const m of ms) {
  out += `\n---\n\n## Mission ${m.order}: ${m.title}\n\n*Virtue: ${m.parent.virtue}.* ${m.parent.summary}\n\n> ${say(m.titleSay)}\n`;
  for (const [pid, p] of Object.entries(m.pages)) {
    out += `\n### Page \`${pid}\`${p.end ? ' (ending)' : ''}\n\n`;
    for (const b of p.beats) {
      const cond = b.if ? ` *(only if ${Object.entries(b.if).map(([k, v]) => `${k} = ${v}`).join(', ')})*` : '';
      const act = b.tap ? ` *(Tommy taps anywhere ${b.tap.count} times: ${b.tap.effect})*` : b.do ? ` *(hands-on: tap the ${b.do.targets})*` : '';
      out += `- ${say(b.say)}${cond}${act}\n`;
    }
    if (p.choice) {
      out += `\n**Choice:** ${say(p.choice.say)}\n`;
      p.choice.options.forEach((o) => { out += `- Card "${o.label}": ${say(o.say)} → \`${o.next}\`\n`; });
    } else if (p.next) out += `\n*Turn the page → \`${p.next}\`*\n`;
  }
}
writeFileSync('docs/SCRIPT.md', out);
console.log('wrote docs/SCRIPT.md', out.length, 'chars');
