# Decisions

Decisions made without the owner, with reasons. Newest last.

## D-001 Branching
The GitHub repo was empty. A small `main` branch holds the first planning commit; all build work happens on a working branch and comes in through a draft pull request, so nothing lands on `main` without the owner looking.

## D-002 Story files are JSON
Each mission is one plain JSON file in `content/missions/`. JSON needs no parser dependency, and a validator script (`npm run check:story`) catches mistakes. The engine discovers mission files automatically, so adding a mission never touches engine code.

## D-003 Text-to-speech: Kokoro-82M
Narration is pre-rendered at build time with **Kokoro-82M** (Apache-2.0 code and weights), voice `af_heart` (a warm, clear American English voice and Kokoro's highest-rated voice). Only npm and PyPI are reachable from the build sandbox; the weights come from the npm package `kokoro-q8-shards` (a byte-identical redistribution of the official 8-bit ONNX export, Apache-2.0) and the voice files from `kokoro-js` (Apache-2.0). Text-to-phoneme uses espeak-ng via the `phonemizer` package at build time only; nothing from it ships in the app (see docs/LICENSES.md).
