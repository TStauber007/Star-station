# Star Station

A read-aloud, choose-your-path picture book for Abigail (4½) and Tommy (2½). They are the crew of a small, friendly space station. A warm voice reads every word. Abigail makes the story choices by tapping one of two pictures; Tommy has "tap anything" moments where any tap makes something lovely happen. Kindness, honesty, patience, courage and taking turns work out well inside the stories, and the space science is real.

There are six missions of about 6 to 7 minutes each. No points, no timers, no ads, no accounts, and nothing ever leaves the tablet.

## Two-minute guide for grown-ups

**1. Get it on the tablet.** See [docs/INSTALL.md](docs/INSTALL.md). Short version: run `npm install` and `npm run build`, then either upload the `dist` folder to a private page you control, or run `npm run serve:lan` on your PC and open the address it prints on the tablet. Then **Add to Home Screen**. After the first load it works offline.

**2. Set names and faces.** On the home screen, **press and hold "Grown-ups" for 3 seconds.** There you can:
- choose **Two crew** (Abigail chooses, Tommy taps) or **One crew** (one child does both), and who is playing;
- pick each child's avatar: skin tone, hair style, hair colour and shirt;
- change names for cousins or friends. The voice then says "Captain" (older child) or "Co-pilot" (younger), and the typed names appear on screen;
- set voice, music and effects volume, turn the words on or off, and switch on **One mission, then lights out**;
- read what each mission teaches, what each choice shows, questions to talk about afterwards, and the science sources.

**3. What to try first.** Sit with both children and play **Mission 1, Welcome Aboard**. When the narrator says "Abigail, …", she taps one of the two big pictures; when it says "Tommy, …", he taps anywhere on the picture. Tap the big yellow arrow to turn the page. Afterwards, ask one of the "talk about it" questions from the grown-ups page.

At bedtime, try **Mission 6, Goodnight, Earth** with *One mission, then lights out* turned on.

### Buttons on every page
- **Home** (top left): hold it for about a second to leave the story, so small hands don't leave by accident.
- **Say it again** and **Pause** (top right).
- The **yellow arrow** turns the page when the page is finished. Nothing moves on to the next page by itself, and missions never play one after another.

## The missions

| # | Mission | Virtue | Science |
|---|---|---|---|
| 1 | Welcome Aboard | Saying hello to someone new | Why astronauts float; Earth from space |
| 2 | The Space Garden | Patience | Plants need light and water; space gardens glow pink |
| 3 | The Wobbly Panel | Honesty | Solar panels turn sunshine into power |
| 4 | Turns at the Telescope | Taking turns and sharing | Why the Moon changes shape |
| 5 | Night-Side Noises | Courage; helping a scared friend | 16 sunrises a day; why the station hums |
| 6 | Goodnight, Earth (bedtime) | Gratitude | Sleeping bags on the wall; no up or down |

The whole script is in [docs/SCRIPT.md](docs/SCRIPT.md).

## Privacy

No accounts, analytics, ads, chat, outbound links, AI at runtime, or network calls. The narration was recorded in advance; the pictures, music and sounds are made by the app itself. Names and stickers are kept only in the tablet's own storage. A strict Content Security Policy blocks the app from contacting anything but its own files, and an automated check confirms it makes zero outside requests and plays with the network switched off ([docs/QA.md](docs/QA.md)).

## For developers

```
npm install          # tools (Vite, TypeScript, Playwright) and the Andika font
npm run dev          # local development server
npm run build        # story check + type check + production build in dist/
npm run build:claude # the claude.ai test copy in dist-claude/ (no offline install; DECISIONS D-021)
npm run verify       # every-path walk, build, privacy check, screenshots
npm run narration    # re-record changed lines (needs the voice tools; see tools/tts/)
```

- Stories are plain JSON in `content/missions/`. To add a mission, see [docs/STORY_BIBLE.md](docs/STORY_BIBLE.md).
- Art is drawn in code in `src/art/` ([vocabulary](src/art/README.md)).
- Decisions made along the way: [DECISIONS.md](DECISIONS.md). Status: [CHECKLIST.md](CHECKLIST.md), [PROGRESS.md](PROGRESS.md).
- Licenses: [docs/LICENSES.md](docs/LICENSES.md). Science sources: [docs/SCIENCE_SOURCES.md](docs/SCIENCE_SOURCES.md). QA results: [docs/QA.md](docs/QA.md).

### Re-recording narration

The narration tools run at build time only and live in `tools/tts/`:

```
cd tools/tts
npm install --ignore-scripts                 # Kokoro model weights and voice files (from npm)
python3.12 -m venv .venv && .venv/bin/pip install "misaki[en]==0.9.4" onnx onnxruntime numpy
.venv/bin/python prepare_model.py            # checks the model and adds word timings
cd ../.. && npm run narration                # records only lines that changed
```
