# Progress log

Newest first. Each entry says what was done and what's next, so a fresh session can resume from the repo alone.

## 2026-10-17 — Session 1 (later)
- Six missions written (`content/missions/*.json`), read-aloud edited, all paths 6.0–7.2 minutes on real audio.
- Narration recorded with Kokoro-82M `af_heart` for all 7 crew setups: 896 clips, 66 minutes, word timings (`public/narration`, `src/generated/narration.json`).
- Art library drawn in code (`src/art`): crew avatars, Button, 7 places, props, 36 choice cards, 7 stickers, app icon.
- App built (`src/app`, `src/ui`, `src/audio`): player, stage, captions, choices, taps, targets, home, ending, wall, lights-out, grown-ups page, procedural music and effects, service worker, CSP.
- Verification scripts: `tools/verify/walk-paths.ts` (data + `--engine`), `screenshots.ts`, `privacy.ts`, `perf.ts`.
- Docs: README, INSTALL, LICENSES, STORY_BIBLE, SCRIPT, art README; science sources by a research subagent.
- Next: finish the verification runs, the independent science check, and docs/QA.md.

## 2026-10-17 — Session 1
- Repo was empty. Created planning docs (CHECKLIST, PROGRESS, DECISIONS).
- Environment: only npm and PyPI reachable from the build sandbox (Hugging Face and GitHub downloads blocked). Found Kokoro-82M TTS weights and voices on npm (see DECISIONS D-003).
- Next: project skeleton, TTS proof of concept.
