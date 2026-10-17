# Star Station — Checklist

Status keys: `[ ]` open · `[~]` in progress · `[x]` done

## Foundation
- [x] Vite + TypeScript project, minimal dependencies, licenses recorded
- [x] Story data format (plain JSON per mission) + validator
- [x] Engine: pages, beats, choices, tap-anything moments, hands-on moments, endings
- [x] Settings in local storage only (names, avatars, crew mode, volume, captions, lights-out)

## Story
- [x] docs/STORY_BIBLE.md (characters, world, tone, how to add a mission)
- [x] Mission 1 — Welcome Aboard
- [x] Mission 2 — The Space Garden
- [x] Mission 3 — The Wobbly Panel
- [x] Mission 4 — Turns at the Telescope (renamed, see DECISIONS D-010)
- [x] Mission 5 — Night-Side Noises (renamed, see DECISIONS D-010)
- [x] Mission 6 — Goodnight, Earth (bedtime)
- [x] Each mission: 3–4 choice points, reconverging branches, warm ending, 6–10 min
- [x] Tommy "tap anything" moment in every scene stretch
- [x] Hands-on moments (water, stars, panel…) in every mission

## Narration
- [x] Open-source TTS pipeline (build time only), license recorded
- [x] Every line rendered for every crew setup (named two-crew, solo Abigail, solo Tommy, generic two-crew, generic solo)
- [x] Word timings for highlighting
- [x] Pause / replay / caption toggle

## Look & sound
- [x] Code-drawn SVG art: station places, Earth, Moon, crew, robot, props
- [x] Consistent characters, gentle motion, 60 fps-friendly layers
- [x] Parent-pickable avatars (no photos)
- [x] Procedural ambient music + gentle effects (Web Audio), low default volume
- [x] Portrait + landscape, big targets (≥ 88 px)

## Calm design
- [x] Calm ending screen, no autoplay into next mission
- [x] One keepsake sticker per finished mission on the station wall
- [x] No points/coins/streaks/timers/hooks
- [x] "One mission, then lights out" mode

## Parent page
- [x] Hold-to-enter grown-up gate
- [x] Names, avatars, crew mode, volume, captions, lights-out
- [x] Per-mission: virtue, science, paths, talk-about questions
- [x] Science sources

## Build
- [x] Installable offline PWA (service worker + manifest + icons)
- [x] Zero runtime network calls (CSP + check)
- [x] docs/INSTALL.md (private hosting + home-PC options)

## Verification (results in docs/QA.md)
- [x] Every-path walker: all paths end, all cues have audio, no dead ends (plus 144/144 engine play-throughs)
- [x] Playwright screenshots: 1024×768, 768×1024, 1280×800 and 800×1280 (10" Android) for every scene — reviewed and fixed
- [x] Read-aloud check with logged cuts
- [x] Independent science check by subagent, flags fixed
- [x] Privacy check: zero network requests in an offline context

## Docs
- [x] docs/QA.md with every verification result
- [x] README.md (two-minute parent guide)
- [x] docs/SCIENCE_SOURCES.md
- [x] docs/LICENSES.md
- [x] DECISIONS.md, PROGRESS.md current
