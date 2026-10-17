# Licenses

Everything Star Station uses, what it is for, and its license. "Shipped" means it is part of the app that goes onto the tablet. "Build time" means it was only used on the computer that made the app, and none of it is inside the app.

## What ships on the tablet

| Part | What it is | License |
|---|---|---|
| App code, stories, art, music and sound code | Written for this project. All pictures are drawn in code (SVG); all music and sound effects are made in the browser with Web Audio; there are no sound samples or AI-generated images. | Owned by the project owner |
| App icons (`public/icons/*.png`) | Rasterised from the code-drawn SVG icon by `tools/make-icons.ts` | Owned by the project owner |
| Narration audio (`public/narration/*.mp3`) | Pre-recorded at build time with the Kokoro-82M text-to-speech model, voice `af_heart` (see below) | Generated output, owned by the project owner. Kokoro's Apache-2.0 license puts no restrictions on audio it produces. |
| Andika font, regular and bold, Latin subset (`@fontsource/andika` 5.3.0) | A typeface designed by SIL International for beginning readers, used for the captions and all text | SIL Open Font License 1.1 (font files); MIT (Fontsource packaging) |

There are no other runtime dependencies: `npm ls --omit=dev` lists only `@fontsource/andika`.

## Narration: the text-to-speech model and voice

| Part | Version | License | Notes |
|---|---|---|---|
| **Kokoro-82M** model (hexgrad) | v1.0, 8-bit ONNX export (`onnx-community/Kokoro-82M-v1.0-ONNX`, `model_quantized.onnx`) | **Apache-2.0** | Obtained from the npm package `kokoro-q8-shards` 1.0.0 (Apache-2.0), a byte-for-byte redistribution split into six parts. The joined file's SHA-256 is checked: `fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478`. |
| **Voice `af_heart`** | Kokoro-82M v1.0 voice pack | **Apache-2.0** (released with the model) | Taken from the npm package `kokoro-js` 1.2.1 (Apache-2.0), which ships the official voice files. |
| misaki (hexgrad) | 0.9.4 | Apache-2.0 | Kokoro's own text-to-phoneme library, with its English pronunciation dictionaries. |
| spaCy | 3.8.16 | MIT | Only its blank English word-splitter is used (no downloaded model). |
| espeak-ng (via `espeakng-loader` 0.2.4 and `phonemizer-fork` 3.3.2) | 1.52 | GPL-3.0-or-later (espeak-ng, phonemizer-fork); MIT (espeakng-loader wrapper) | Fallback pronunciations for words not in misaki's dictionary. Used only as a tool at build time; it is not part of the app and is not distributed with it. GPL terms cover copying the program, not the audio it helps make. |
| ONNX Runtime (Python) | 1.31.0 | MIT | Runs the model at build time. |
| onnx (Python) | 1.23.2 | Apache-2.0 | Adds the per-phoneme duration output used for word highlighting. |
| NumPy | 2.5.4 | BSD-3-Clause (and bundled permissive licenses) | Audio arrays. |
| num2words | 0.5.6 | LGPL-2.1 | misaki dependency (numbers to words). Build time only. |
| PyTorch | 2.14.1 | BSD-style (Apache-2.0, BSD, MIT components) | Installed as a dependency of the spaCy packages; not used to make sound. Build time only. |
| FFmpeg with LAME | 6.1 | LGPL-2.1+ / GPL-2.0+ (FFmpeg), LGPL (LAME) | Encodes the MP3 files at build time. Used as a separate program; not part of the app. MP3 patents have expired. |
| kokoro-js and its npm dependencies (`@huggingface/transformers` 3.8.1 Apache-2.0, `onnxruntime-node` 1.30.0 MIT, `phonemizer` 1.2.1 Apache-2.0) | — | as listed | Installed only to obtain the voice files; their code is not used to make the narration and is not in the app. |

The narration tools live in `tools/tts/` and have their own `package.json` and Python virtual environment, so none of this can end up in the app bundle.

## Build and check tools (not shipped)

| Tool | Version | License |
|---|---|---|
| Vite | 8.3.4 | MIT |
| TypeScript | 5.9.3 | Apache-2.0 |
| @playwright/test / playwright-core (screenshots and checks) | 1.56.1 | Apache-2.0 |
| Chromium (bundled with the build sandbox, used by Playwright) | — | BSD-3-Clause and others |
| @types/node | 22.20.5 | MIT |
| Node.js | 22 | MIT |

## Science sources

The facts in the stories come from public NASA, ESA, NOAA and university pages, listed in `docs/SCIENCE_SOURCES.md`. The app shows their addresses as plain text for grown-ups; it never links out.
