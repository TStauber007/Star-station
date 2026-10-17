# Star Station — Checklist

Status keys: `[ ]` open · `[~]` in progress · `[x]` done

## Foundation
- [ ] Vite + TypeScript project, minimal dependencies, licenses recorded
- [ ] Story data format (plain JSON per mission) + validator
- [ ] Engine: pages, beats, choices, tap-anything moments, hands-on moments, endings
- [ ] Settings in local storage only (names, avatars, crew mode, volume, captions, lights-out)

## Story
- [ ] docs/STORY_BIBLE.md (characters, world, tone, how to add a mission)
- [ ] Mission 1 — Welcome Aboard
- [ ] Mission 2 — The Space Garden
- [ ] Mission 3 — The Wobbly Panel
- [ ] Mission 4 — One Window, Two Friends
- [ ] Mission 5 — The Dark Side Noises
- [ ] Mission 6 — Goodnight, Earth (bedtime)
- [ ] Each mission: 3–4 choice points, reconverging branches, warm ending, 6–10 min
- [ ] Tommy "tap anything" moment in every scene stretch
- [ ] Hands-on moments (water, stars, panel…) in every mission

## Narration
- [ ] Open-source TTS pipeline (build time only), license recorded
- [ ] Every line rendered for every crew setup (named two-crew, solo Abigail, solo Tommy, generic two-crew, generic solo)
- [ ] Word timings for highlighting
- [ ] Pause / replay / caption toggle

## Look & sound
- [ ] Code-drawn SVG art: station places, Earth, Moon, crew, robot, props
- [ ] Consistent characters, gentle motion, 60 fps-friendly layers
- [ ] Parent-pickable avatars (no photos)
- [ ] Procedural ambient music + gentle effects (Web Audio), low default volume
- [ ] Portrait + landscape, big targets (≥ 88 px)

## Calm design
- [ ] Calm ending screen, no autoplay into next mission
- [ ] One keepsake sticker per finished mission on the station wall
- [ ] No points/coins/streaks/timers/hooks
- [ ] "One mission, then lights out" mode

## Parent page
- [ ] Hold-to-enter grown-up gate
- [ ] Names, avatars, crew mode, volume, captions, lights-out
- [ ] Per-mission: virtue, science, paths, talk-about questions
- [ ] Science sources

## Build
- [ ] Installable offline PWA (service worker + manifest + icons)
- [ ] Zero runtime network calls (CSP + check)
- [ ] docs/INSTALL.md (private hosting + home-PC options)

## Verification (results in docs/QA.md)
- [ ] Every-path walker: all paths end, all cues have audio, no dead ends
- [ ] Playwright screenshots: 1024×768, 768×1024, 1280×800 (10" Android) for every scene — reviewed and fixed
- [ ] Read-aloud check with logged cuts
- [ ] Independent science check by subagent, flags fixed
- [ ] Privacy check: zero network requests in an offline context

## Docs
- [ ] README.md (two-minute parent guide)
- [ ] docs/SCIENCE_SOURCES.md
- [ ] docs/LICENSES.md
- [ ] DECISIONS.md, PROGRESS.md current
