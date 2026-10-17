# Decisions

Decisions made without the owner, with reasons. Newest last.

## D-001 Branching
The GitHub repo was empty. A small `main` branch holds the first planning commit; all build work happens on a working branch and comes in through a draft pull request, so nothing lands on `main` without the owner looking.

## D-002 Story files are JSON
Each mission is one plain JSON file in `content/missions/`. JSON needs no parser dependency, and a validator script (`npm run check:story`) catches mistakes. The engine discovers mission files automatically, so adding a mission never touches engine code.

## D-003 Text-to-speech: Kokoro-82M
Narration is pre-rendered at build time with **Kokoro-82M** (Apache-2.0 code and weights), voice `af_heart` (a warm, clear American English voice and Kokoro's highest-rated voice). Only npm and PyPI are reachable from the build sandbox; the weights come from the npm package `kokoro-q8-shards` (a byte-identical redistribution of the official 8-bit ONNX export, Apache-2.0) and the voice files from `kokoro-js` (Apache-2.0). Text-to-phoneme uses espeak-ng via the `phonemizer` package at build time only; nothing from it ships in the app (see docs/LICENSES.md).

## D-004 Names for cousins and friends: "Captain" and "Co-pilot"
If the parent changes a name, that child's lines use a generic word: "Captain" for the older child (who chooses) and "Co-pilot" for the younger (who taps); "the crew" never needs a name. Each child is handled separately, so "Abigail" can play with a cousin called "Co-pilot". There are 7 pre-recorded crew setups: both named, either one renamed, both renamed, and one-child mode for Abigail, Tommy or a renamed child. Lines that sound the same in every setup are recorded once.

## D-005 Captions match the voice; typed names go on badges
Captions show exactly what the voice says (so word highlighting lines up for early readers). The typed names appear on the "whose turn" badge, which has the child's avatar face, and on picture-card labels.

## D-006 One-crew mode tells the story with one child
In one-crew mode only that child is drawn and named, and they do both the choosing and the tapping. Lines use `[two|solo]` wording so both versions read naturally.

## D-007 Page turns wait for a tap
A page never advances by itself; a big yellow arrow appears when the page is done. This keeps the pace calm and in the family's hands. Tap-anything moments wait for Tommy (a soft ripple hint appears after 9 seconds) and never time out.

## D-008 "Say it again" repeats the last line
Replay repeats the line just read. During a choice it reads the question and both cards again.

## D-009 "One mission, then lights out"
When on, finishing a mission shows a sleeping-station screen instead of home. A grown-up unlocks it by holding the Grown-ups button for 3 seconds, and it also wakes by itself after 6 hours so nobody finds it locked the next day.

## D-010 Mission titles
Mission 4 is "Turns at the Telescope": the brief's "One Window, Two Friends" doesn't fit two children plus Button. Mission 5 is "Night-Side Noises": "the dark side" is strongly tied to a film franchise. Mission 6 keeps the owner's title, "Goodnight, Earth", and the script avoids the phrase "Goodnight, Moon".

## D-011 No pull request opened
The owner's standing preference is not to post or send anything on any platform without explicit permission. Work is committed and pushed to the branch `claude/star-station-build`, but no pull request was opened. Opening one is a one-click step for the owner.

## D-012 Narration audio format
MP3, mono, 24 kHz, about 37 kbps (LAME VBR quality 7). MP3 decodes everywhere, including iPad Safari, which matters more than the size saved by Opus. Total about 20 MB for 66 minutes. Each clip's loudness is levelled, and sentences get a short read-aloud pause between them.

## D-013 Narration pace
Kokoro speed 0.82 (about 136 words a minute) for day missions and 0.74 for the bedtime mission, with 0.65 s (1.0 s at bedtime) between lines.

## D-014 Button the robot
The helper robot is called Button (a glowing orange button on its tummy: "Boop!"). The stories use "Button" and "its", never "he" or "she".

## D-015 The telescope is invented
Star Station is a made-up station modelled on the ISS. Its little telescope is a story invention (real crews use cameras with long lenses at the Cupola); everything stated as fact about real stations is sourced.

## D-016 Science sources are plain text in the app
The grown-ups page shows each source's address as text, not a link, so the app has no outbound links at all.

## D-017 Hand-written service worker
A ~40-line service worker precaches every file (listed at build time) and serves everything cache-first. That avoids a large plugin dependency, and it's easy to read.

## D-018 Andika font
Captions and all text use Andika (SIL Open Font License), a typeface designed for children learning to read: clear letter shapes and a single-storey "a". It is bundled, so it never loads from the internet.

## D-019 Safe tap sizes
Child-facing buttons are at least 88 px (most are 104–150 px). Hands-on targets are at least 104 px. Home needs a 1.2-second hold, and the grown-ups page a 3-second hold.

## D-020 Word timings from the model itself
The Kokoro ONNX export only outputs audio, so the build adds its internal per-phoneme duration tensor as a second output (a graph edit at build time). Word start and end times then come from the model's own timing, using the same method as Kokoro's official pipeline.
