# Star Station — Story Bible

Everything a writer needs to keep the stories consistent, and to add a new mission.

## The world

**Star Station** is a small, friendly space station sailing around the Earth. It is our own made-up station, but it is built like a real one, and the honest details come from the International Space Station:

- Everything floats, because the whole station is falling around the Earth.
- **Handrails** line the walls. **Velcro** patches hold things that would otherwise float off.
- **The Cupola** is a round room made of seven windows, looking down at the Earth.
- **The garden** glows pink and purple under red and blue grow lights. Seeds grow in soft **plant pillows**.
- Two big **solar wings** outside turn sunshine into power. Batteries keep the lights on in Earth's shadow.
- **Fans** hum all day and night, because air doesn't move around by itself in space.
- The **water machine** cleans water so it can be used again and again. It gurgles.
- The crew sleeps in **sleeping bags tied to the wall**.
- Food: **tortillas** instead of bread (no floating crumbs). Drinks come in pouches with straws.
- Supply ships dock now and then, bringing food, water and new things.
- Outside: the blue Earth with white clouds, golden city lights on the night side, green aurora ribbons near the poles, the Moon, the Sun, and lots and lots of stars.
- Day and night come quickly: a sunrise and a sunset about every hour and a half.

**Mission Control** is a friendly voice on the radio from Earth. It is only ever heard, never seen, and only says kind, short things.

## The crew

### Abigail (4½) — the crew member who chooses
- Curious, brave, a big asker of questions. She likes to be the one who knows the way, and she is learning that waiting and sharing are part of that.
- In the story, she makes the choices. The narrator asks her by name: "Abigail, which way should we go?"
- Look: a little taller than Tommy. Her hair floats up in space. The parent picks her avatar (skin tone, hair, hair colour, shirt colour).

### Tommy (2½) — the crew member who taps
- Giggly, cheerful, loves buttons, stars, and Button the robot.
- His moments are "tap anything" moments: any tap anywhere works and something lovely happens. He is never asked to choose, wait, aim, or drag.
- Look: a little shorter and rounder than Abigail. Hair floats in a tuft. Parent-picked avatar.

### Button — the helper robot (original character)
- A round, mint-green robot about the size of a beach ball, with a dark screen face, two glowing eyes, a short antenna with a little light, two small arms, and a round orange button on its tummy that glows when Button is happy. ("My name is Button. Because of this! Boop!")
- Floats along on tiny whirring fans.
- Kind, a little literal, loves facts, says "Beep" and "Boop". Button is the voice of the science: it explains things simply and correctly.
- Button has feelings and shows them through its tummy light and antenna: bright and perky when happy, dim and droopy when sad or left out, wobbly when scared.
- Button is **new** in Mission 1, **scared** in Mission 5, and **always forgiving**.
- Pronouns: the stories say "Button" and, for body parts, "its" ("its tummy light").

### The narrator
A warm storyteller who tells the story in the third person ("Abigail and Tommy floated into the Cupola") and turns to the children by name at their turns ("Tommy, can you wake up the stars?"). The narrator says "we" at decision moments, so the children feel like crew.

## Tone rules

- Short, warm sentences with a read-aloud rhythm. Sound words are welcome: *boop, blup, rrrip, swish, gurgle.*
- Gentle humour that grown-ups enjoy too: Button drawing "a very square circle", a sock floating away, a polite water machine.
- **No scary peril, no villains, no shaming, no sarcasm.** Nobody is ever in danger. Mistakes are small, and fixable.
- **No stated morals.** Nobody says "and that's why we always…". Characters show kindness, honesty, patience, courage and sharing, and the story shows how things turn out.
- A less kind or less careful choice leads to a gentle, natural consequence (a friend's light goes dim; a little root droops), then the characters make it right, and the paths join again. There is no failure screen.
- Every science line is true. Simplify, never mislead. Every fact has a source in `docs/SCIENCE_SOURCES.md`.
- No real brands, characters or franchises. Avoid lines that echo famous books or films.
- Calm pacing: no countdowns, no "hurry!", no loud surprises.
- Each "stretch" between two choices includes at least one Tommy "tap anything" moment.

## Crew setups and name templates

Narration is pre-recorded for every crew setup, so the voice can say the children's names. Lines in mission files use these templates:

| Template | Two named crew | Solo (Abigail or Tommy) | Renamed crew (generic) |
|---|---|---|---|
| `{A}` the chooser, spoken to | Abigail | the solo child's name | Captain |
| `{T}` the tapper, spoken to | Tommy | the solo child's name | Co-pilot (solo: Captain) |
| `{a}` the chooser, in the story | Abigail | the solo child's name | the Captain |
| `{t}` the tapper, in the story | Tommy | the solo child's name | the Co-pilot (solo: the Captain) |
| `{crew}` everyone in the crew | Abigail and Tommy | the solo child's name | the Captain and the Co-pilot (solo: the Captain) |
| `[two words|solo words]` | first part | second part | by crew size |

If a parent renames one or both children, that child's lines use the generic word ("Captain" for the older child, "Co-pilot" for the younger), and the screen shows the typed name on the child's turn badge. A name at the start of a sentence is capitalised automatically ("The Captain floated…").

Write so that every setup reads naturally. `npm run check:story` prints every variant of every line (`--print`), so the read-aloud check covers them all.

## Missions

| # | Title | Virtue | Science |
|---|---|---|---|
| 1 | Welcome Aboard | Saying hello to someone new | Why astronauts float; Earth from orbit |
| 2 | The Space Garden | Patience | Plants need light and water; space garden lights |
| 3 | The Wobbly Panel | Honesty and owning mistakes | Sunlight makes power; batteries in Earth's shadow |
| 4 | Turns at the Telescope | Taking turns and sharing | Moon phases; moonlight is sunlight |
| 5 | Night-Side Noises | Courage; helping someone who's scared | Day and night every 90 minutes; why the station hums |
| 6 | Goodnight, Earth | Gratitude | Sleeping bags on the wall; no up or down |

## How to add a mission

1. Copy an existing file in `content/missions/` (for example `02-space-garden.json`) to a new name such as `07-comet-day.json`. Files are picked up automatically and sorted by `order`.
2. Edit the fields:
   - `id` (lowercase, dashes), `order`, `title`, `titleSay` (the spoken title), `sticker` (a keepsake id, see `src/art/stickers.ts`), `cover` (art for the mission card), `mood` (`"day"` or `"bedtime"`), optional `speed` (narration speed, default 0.82).
   - `parent`: `virtue`, `science` (list), `summary`, `paths` (what each choice shows), `talk` (2–3 questions for afterwards).
   - `state`: starting values for anything a choice remembers (for example `{ "plant": "lettuce" }`).
   - `start`: the first page id, and `pages`: the pages.
3. A page has `art` (what to draw), `beats` (what happens, in order), and then exactly one of:
   - `"next": "page-id"` — a big arrow appears when the page is done;
   - `"choice": { "say": "...", "options": [two options] }` — two big picture cards;
   - `"end": true` — the calm ending screen with the keepsake sticker.
4. A beat is `{ "say": "a line" }`, optionally with:
   - `"art": { ... }` to change the picture before the line;
   - `"tap": { "effect": "stars", "count": 4 }` — a Tommy "tap anything" moment after the line;
   - `"do": { "targets": "bolts" }` — a hands-on moment with big tap targets after the line;
   - `"if": { "plant": "lettuce" }` — only when the story remembers that;
   - `"sfx": "chime"` — a gentle sound with the line.
5. A choice option is `{ "card": "picture-id", "label": "Wave", "say": "Wave hello?", "next": "page-id", "set": { "key": "value" } }`.
6. Art vocabulary (places, poses, props, cards, tap effects, targets) is listed in `src/art/README.md`.
7. Run `npm run check:story` (format, paths, reachability), then `npm run narration` to record the new lines, then `npm run verify:paths`.
8. Add each new science fact to `docs/SCIENCE_SOURCES.md`, with a source.
