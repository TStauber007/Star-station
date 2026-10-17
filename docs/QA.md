# Quality checks

Results of every verification step, run on the final build on 2026-10-17. Each check is a script you can re-run (commands below); the raw reports land in `qa/`.

| Check | Result |
|---|---|
| Every path, every crew setup | **Pass.** 6 missions, 48 paths, 7 crew setups; all 896 narration clips present, and each one says exactly what the script says. Every path ends on an ending page; no dead ends or unreachable pages. |
| Engine play-through | **Pass.** All 144 runs (48 paths × 3 crew setups) played to their ending in the built app. |
| Running time | **Pass.** Every path runs 6.0–7.2 minutes (measured from the recorded audio plus the app's pauses and time to tap). |
| Screenshots | **Pass.** 1164 screenshots (291 scenes × 4 tablet sizes), 0 automatic layout problems; all reviewed by eye. |
| Read-aloud | **Done.** Every line read in all 7 setups; cuts and rewrites logged below. |
| Independent science check | **Pass after fixes.** 83 science lines: 78 accurate, 2 fixed, 3 now sourced; no age-appropriateness concerns. |
| Privacy (offline) | **Pass.** Zero requests to anything but the app's own files, online or offline; all 910 files cached; a mission plays with the network off and the server stopped. |
| Frame rate | **Pass.** About 60 fps in every busy scene with the CPU slowed 4×. |
| Controls | **Pass.** Pause freezes the story, the paused screen resumes it, replay restarts the line; lights-out locks after one mission and the grown-up hold unlocks it. |

## 1. Every path (`npm run verify:paths`, `node tools/verify/walk-paths.ts --engine`)

`tools/verify/walk-paths.ts` walks every branch of every mission from the story files, tracking what each choice sets, and for each of the 7 crew setups (both named; either renamed; both renamed; one child: Abigail, Tommy or renamed) checks:

- the path ends on a page marked as an ending, with no loops, dead ends or unreachable pages;
- every line on the path (title, every beat that plays for that path's choices, each choice question and both card lines) has a clip in the narration manifest;
- the MP3 exists and is not empty, its word timings are in order and inside the clip;
- the words in the clip are exactly the script's words for that setup (so the audio can never drift from the text).

| Mission | Paths | Running time |
|---|---|---|
| 1. Welcome Aboard | 8 | 6.7–7.0 min |
| 2. The Space Garden | 8 | 6.1–6.7 min |
| 3. The Wobbly Panel | 8 | 6.0–7.2 min |
| 4. Turns at the Telescope | 8 | 6.1–6.7 min |
| 5. Night-Side Noises | 8 | 6.3–6.5 min |
| 6. Goodnight, Earth | 8 | 6.3–6.5 min |

With `--engine`, the script also plays every path inside the real built app (fast mode: narration skipped, taps and targets completed automatically, choices made by the path plan) for three setups: two named children, Tommy alone, and two renamed children (Lily and Max). It confirms the app visits exactly the expected pages and reaches the ending, with no page errors. Result: **144 of 144 runs** reached their ending on exactly the expected pages.

The story checker (`npm run check:story`, run on every build) also fails the build if any stretch of story between two choices, on any path, lacks a Tommy "tap anything" moment, or if a mission names a picture, prop, card, effect or sound that doesn't exist.

## 2. Screenshots (`npm run verify:screens`)

`tools/verify/screenshots.ts` photographs every page of every mission at four sizes:

- iPad landscape 1024×768
- iPad portrait 768×1024
- 10-inch Android landscape 1280×800
- 10-inch Android portrait 800×1280

For each page it takes: the first moment, every tap-anything and hands-on moment (with targets showing), and the last moment, which is the choice cards on choice pages. Choice pages are also shot in one-child mode, and pages whose picture depends on an earlier choice are shot in every variant. Then come the title cards, endings, home, sticker wall (empty and full), grown-ups page, splash and lights-out. That makes 291 scenes × 4 sizes = 1164 screenshots.

Each screenshot is also checked automatically:

- every button a child can tap is at least 88×88 px, fully on screen, and **really tappable at its centre** (nothing covering it);
- hands-on targets are on screen and not hidden under the caption;
- the caption fits, isn't clipped, is at most 32% of the screen height, uses at least 20 px text, and doesn't overlap the buttons, turn badge or page arrow;
- choice cards don't overlap each other or the caption;
- no sideways scrolling and no page errors.

Result: **1164 screenshots, 0 layout problems** on the final build. (Before the last fix, the new "really tappable" check flagged the story's Home, Replay and Pause buttons, which showed dimmed under the ending screen but couldn't be tapped. They are now hidden at the ending.)

### What I looked at and fixed

I reviewed the contact sheets (`qa/sheets/`, made by the same script) for every mission at every size. Problems found and fixed along the way:

| Problem | Fix |
|---|---|
| Three mission covers on the home screen looked the same (all the outside view). | Each mission now has its own cover scene. |
| Mission 3: Button and Abigail piled up by the Sun Catcher; Abigail covered the bolts during "tighten the bolts". | The crew moves to make room whenever the panel is in the picture; Button stands between. |
| Mission 4: Button stood in front of the telescope; Tommy landed on top of Button when it was his turn. | Whoever's turn it is now stands at the eyepiece; the others move aside. |
| Party lights were too small to notice. | Bigger bulbs, a garland across the back wall, and a soft coloured glow. |
| The lettuce looked like striped watermelons. | Greener leaves with light edges. |
| On narrow portrait screens (800×1280) the characters were huge and overlapped. | Characters scale down on narrow screens and are staggered up and down. |
| The caption box covered the big Go button on the mission card, so tapping Go did nothing. | Captions (and the turn badge and title card) can never block a tap, and the mission card shows its own big title instead of a caption. A new automatic check makes sure every child-facing button is really tappable. |
| Picture cards, mission covers and some stickers were zoomed in (a style rule stretched the small pictures inside them). | Fixed the rule; cards show their whole scene. |
| At the dock, a floating box covered Button's face. | Boxes stay behind Button except while Button is hiding. |
| The story's last caption stayed under the ending screen. | It's hidden when the ending appears. |
| The story's Home, Replay and Pause buttons showed dimmed under the ending screen but did nothing. | They're hidden at the ending; the ending's own big buttons are the only ones. |
| The "whose turn" badge was invisible in screenshots (frozen at the start of its slide-in). | Screenshot mode now turns animations off instead of pausing them. |

## 3. Read-aloud check

Every line was read in all seven crew setups (`node tools/check-story.ts --print`), as the parent of a 4½- and a 2½-year-old would hear it: is it clear, warm, never preachy, never scary, and does it read naturally with one child or with "Captain" and "Co-pilot"?

### Cuts and changes

| Where | Before | After | Why |
|---|---|---|---|
| M3 p3 (before the bump) | "Tommy, can you help us spin?" / "Tommy, can you help bounce the ball?" | "Tommy, can you count the somersaults?" / "Tommy, can you count the bounces?" | Tommy's taps came right before the accident. A 2½-year-old could feel he caused the bump; the accident should be nobody's fault. |
| M3 p4-hide | "Button thought it was Button's fault. But it wasn't." | "Button thought it had done something wrong. But it hadn't." | Clumsy, and confusing read aloud. |
| M3 p1 | "…It's called the Sun Catcher. It charges Button's batteries." | "…It's called the Sun Catcher." | The next page says the same thing. |
| M4 p6-chart | "A crescent. A half. A big bulgy one. And soon, a full Moon." | (cut) | Repeated the previous page almost word for word. |
| M4 p6-chart | "The Moon looks like it's growing… But it's the same Moon, all the time. We just see more of its sunny side." | "The Moon isn't really growing," said Button. "We just see more of its sunny side." | Shorter and clearer for a preschooler. |
| M4 end | "…And one big, bright, beautiful Moon, for everybody." | "…And one big, bright, beautiful Moon." | The new sharing page already ends with "One Moon, for everybody to share." |
| M6 p6-stars | "Outside the little window, the stars were shining." | "On the cabin wall, five little glow-in-the-dark stars were shining." | The picture shows glow-stars on the wall; the words must match what the child sees. |
| M1–M6 science lines (9 lines) | e.g. "make everything glow pink", "Solar panels need to face the Sun", "golden sparkles", "In about half an hour" | e.g. "make our garden glow pink", "work best when they face the Sun", "sparkles of gold and white", "Soon, in less than an hour" | Flagged by the sources research as slightly overstated; see docs/SCIENCE_SOURCES.md. |
| Titles | "One Window, Two Friends", "The Dark Side Noises" | "Turns at the Telescope", "Night-Side Noises" | Two children plus Button are three friends; "dark side" is tied to a film franchise. |

### Added, so every path runs at least 6 minutes on real audio

- M3: "Hmm," said Button. "Let's go and take a look." (tell path); the Sun slipping behind the Earth, and Tommy waving goodbye to it.
- M4: a new page where the crew shares the full Moon with Mission Control ("People all over the world can look up, and see the very same Moon.").
- M5: Button's flickering light when scared; a brave high-five from Tommy; "Just a fan, a spoon, and a water machine."; golden sunrise light filling the Cupola.

### Kept on purpose

- M1 "Our whole station is always falling around the Earth": the word "falling" is followed at once by "swooping around and around, and never landing", which keeps it gentle.
- M3 "Did I break my charger? Is it my fault?": this is the natural consequence of hiding the panel, and it is put right four lines later. It is the heart of the honesty story.
- M5 the three noises and Button being scared: the noises are soft, the children are never in danger, and each noise turns out to be friendly. The fear is Button's, and the children help.
- "Robots don't" appears in M1 and M2: a small running joke.

### Tommy's moments

`npm run check:story` fails if any stretch between two choices, on any path, has no Tommy "tap anything" moment. Every stretch of every path has at least one.

### Preachiness

No line states a moral. The closest are characters' own words ("Thank you for telling me", "I don't feel shy anymore", "Hiding didn't make it stop"), which describe what happened and how someone feels.

## 4. Independent science check

A separate reviewer was given only `docs/SCRIPT.md` and `docs/SCIENCE_SOURCES.md`, and told to check every line about real science for accuracy and age-appropriateness. Its full report, with a table of all 83 lines and the resolution of each flag, is `qa/science-check.md`.

- **Needs fix (2), both fixed:** "The Earth was coming into view!" (the Earth doesn't come and go from the window; it's always below) became "The Sun was shining on the Earth below!"; "reaching **up** toward the lights" lost the "up" (there's no up in space, which Mission 6 teaches).
- **Not sourced (3), all resolved:** floating hair (source added: NASA's 2013 video of Karen Nyberg); orange zinnias (source added: the first bloom on the station was orange); "the little root began to dry out" became "the little root didn't like being out of its cozy pillow", which makes no science claim.
- **Optional polish, taken:** "watch the Moon change shape", "floated along the station", "Where lots of people are sleeping".
- **Age-appropriateness:** no concerns. The reviewer's reading tip: say Mission 5's "GURGLE!" in a silly voice, not a loud one. The recorded narrator already reads it warmly.

An earlier research pass (which wrote `docs/SCIENCE_SOURCES.md`) had already softened nine lines, for example "make **our garden** glow pink", "solar panels **work best** when they face the Sun", and "the Sun comes back **in less than an hour**". It had also flagged four more: roots growing "down, down, down", "weeks and weeks" before the first sprout, hair floating "up", and a pajama leg floating "like a balloon". All were fixed.

**Still for a person to do:** the sandbox could not open web pages directly, so sources were checked through search results. Click each link in `docs/SCIENCE_SOURCES.md` once before relying on it; three are marked as possibly moved, and each of those facts has another source.

## 5. Privacy (`npm run verify:privacy`)

`tools/verify/privacy.ts`:

1. **Scans the build.** No `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, WebRTC, geolocation, camera/microphone, cookies or IndexedDB in the code, and no outbound links. The only web addresses inside the build are the SVG namespace and the science-source addresses, which the grown-ups page shows as plain text. A Content-Security-Policy meta tag (`default-src 'self'; connect-src 'self'; …`) stops the app from loading from, or talking to, anything else.
2. **First visit, online.** Every request goes to the app's own server (5 requests, 0 elsewhere; anything else would also be blocked and reported). The service worker caches all 910 files.
3. **Offline.** The test switches the browser to offline **and stops the server**, then reloads, taps Start, opens Mission 1 and listens for 16 seconds. 12 requests, all answered by the offline cache, including 7 narration clips. No request to any other address, online or offline.

## 6. Frame rate (`node tools/verify/perf.ts`)

Headless Chromium at 1280×800, 2× pixel density, with the CPU slowed 4× to stand in for a mid-range tablet:

| Scene | Frames per second | 95th-percentile frame | Frames over 34 ms |
|---|---|---|---|
| home | 60.2 | 16.8 ms | 0 |
| orbit (M1 p1) | 60.2 | 16.7 ms | 0 |
| hub with crew (M1 p11) | 60.2 | 16.7 ms | 0 |
| cupola night (M4 p9) | 60.2 | 16.8 ms | 0 |
| garden (M2 p8) | 60.2 | 16.7 ms | 0 |
| choice cards (M1 p3) | 60.2 | 16.7 ms | 0 |
| sleep cabin (M6 p7) | 60.2 | 16.7 ms | 0 |

The art is built for this: the backgrounds are drawn once; only small character and star layers move, and only with transforms and opacity, which the graphics chip handles. Real tablets also have a GPU, which this test doesn't slow down.

## 7. Controls and calm features (dev scripts in `tools/dev/`)

- `controls.ts`, with real narration: pausing freezes the story (same page, line and word for 3 seconds), tapping the paused screen resumes, and "say it again" restarts the current line from its first word.
- `lightsout.ts`: with "One mission, then lights out" on, the ending offers only a "Lights out" button; the station is still asleep after restarting the app; holding Grown-ups for 3 seconds opens the grown-ups page and turns the lights back on.
- `flow.ts`: splash → home → mission card → Go → the mission starts, the way a child does it.
- Renamed children: the voice says "Captain" and "Co-pilot", and the turn badge shows "Lily" and "Max".

## Re-running the checks

```
npm run check:story                       # story format, paths, Tommy's moments, art names
npm run verify:paths                      # every path, every crew setup, audio matches text
node tools/verify/walk-paths.ts --engine  # also play every path in the built app
npm run build && npm run verify:privacy   # offline and network check
npm run verify:screens                    # screenshots + layout checks (about 25 minutes)
node tools/verify/perf.ts                 # frame rate
```
