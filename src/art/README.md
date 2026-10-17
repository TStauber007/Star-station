# Art vocabulary

Everything a mission file can ask the artist (the code in this folder) to draw. The story checker (`npm run check:story`) rejects any name not listed here; the lists live in `vocab.ts`.

A page's `art` looks like this:

```json
{ "place": "cupola", "time": "night", "crew": "look", "robot": "happy", "moon": "full", "props": ["moon-chart"] }
```

A beat's `art` changes only the fields it names. Values may use `$name` to insert something the story remembers, for example `"lights": "$shipColor"` or `"props": ["harvest-$plant"]`.

## place
| value | what it is |
|---|---|
| `orbit` | Star Station from outside, above the Earth |
| `hub` | the main module: racks, handrails, Velcro, a round hatch at the end |
| `dock` | the hub with the big hatch to the supply ship |
| `garden` | the hub with the glowing plant chamber |
| `cupola` | the seven-window room looking down at the Earth |
| `sleep` | the crew cabin with sleeping bags on the wall and a round window |
| `tunnel` | the dim passage to the water machine |

## time
`day`, `night`, `sunset`, `sunrise`

## lights
`on`, `off`, `yellow`, `blue` (party lights), `bedtime`, `bedtime-dim`, `garden-off` (only the plant chamber dark)

## crew (both children together, or the one child in one-crew mode)
`float`, `wave`, `sing`, `zoom`, `hold` (holding Button's hands), `look`, `cheer`, `worry`, `tumble`, `squish`, `telescope` (the younger child, or the solo child, looks through it), `blanket`, `pajamas`, `bed`, `bed-up`, `bed-down`, `none`

## robot (Button)
`none`, `hidden`, `peek`, `shy`, `happy`, `wave`, `spin`, `giggle`, `sad`, `sleepy`, `scared`, `brave`, `look`, `dance`, `charge`, `fix`, `worry`, `wait`, `telescope`, `squish`, `blanket`, `mask`, `rest`, `dream`, `glow`

## moon
`none`, `crescent`, `half`, `gibbous`, `full` (lit from the right, like the evening Moon)

## props
- hub: `sock`, `sock-caught`, `sock-velcro`, `cupola-glow`, `window-sun`, `suncatcher-ok`, `suncatcher-wobbly`, `suncatcher-fixed-off`, `suncatcher-wall`, `suncatcher-on`, `curtain`, `ball`, `tortillas`, `notes`, `bag`, `table`, `spoon-bag`, `spoon-table`, `spoon-velcro`, `flashlight-on`, `drink-pouch`, `drawing`
- dock: `hatch-closed`, `hatch-open`, `boxes`
- garden: `plants-0`, `plants-seeded`, `plants-1`, `plants-2`, `plants-3`, `seed-packet-lettuce`, `seed-packet-zinnia`, `pouch`, `water-ball`, `seed-peek`, `roots`, `harvest-lettuce`, `harvest-zinnia`
- elsewhere: `telescope`, `moon-chart`, `city-lights`, `aurora`, `count-stars`, `water-machine`, `wings-glint`

## Tommy's tap-anything effects (`"tap": { "effect": …, "count": n }`)
`wake` (station windows light up), `boop`, `hello` (hearts), `partylights`, `growlights`, `sparkle`, `bubbles`, `grow` (sleeps go by), `sunbeams`, `spin`, `bounce`, `charge` (Button's battery fills), `stars` (a star appears where you tap), `moon` (the Moon grows), `giggle`, `twinkle`, `sunset`, `sunrise`, `breeze`, `clink`, `dim`

## hands-on targets (`"do": { "targets": … }`)
`sock`, `pillows` (3), `pouch` (tap 3 times), `panel`, `bolts` (3), `sprout`, `lens` (tap 3 times), `moon-chart` (4), `spoon`, `count-stars` (5)

## choice cards (`"card": …`)
`wave`, `song`, `zoom`, `show-way`, `color-yellow`, `color-blue`, `lettuce`, `zinnia`, `dig`, `rest`, `draw`, `sing-plants`, `somersault`, `ball`, `tell`, `hide`, `face-window`, `face-wall`, `turns`, `squeeze`, `first-crew`, `first-button`, `keep-looking`, `button-turn`, `hold-hand`, `flashlight`, `bag`, `table`, `go-together`, `blanket`, `pajamas`, `toothbrush`, `right-side-up`, `upside-down`, `thanks-earth`, `thanks-button`

## sounds (`"sfx": …`)
`chime`, `velcro`, `dingdong`, `hatch`, `whirl`, `song`, `boop`, `whoosh`, `blup`, `crunch`, `radio`, `bump`, `wobble`, `swish`, `powerdown`, `click`, `hum`, `clink`, `gurgle`, `zip`

## Stickers (keepsakes, `src/art/stickers.ts`)
`hello-button`, `garden-lettuce`, `garden-zinnia`, `sun-catcher`, `full-moon`, `flashlight`, `sleepy-star`

New drawings need code: add the drawing in `props.ts`, `cards.ts` or `places.ts`, list its name in `vocab.ts`, and check it with `node tools/dev/preview.ts cards out.png` or `node tools/dev/scenes.ts out.png 1.333 <mission-id>`.
