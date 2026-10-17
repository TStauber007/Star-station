"""Build-time only: renders every narration job to MP3 with word timings.

Reads tools/tts/.work/jobs.json (written by `node tools/narration.ts jobs`),
writes public/narration/<id>.mp3 and content/generated/narration-timings.json.
Already-rendered clips are skipped, so it can be stopped and resumed."""
import json, pathlib, re, subprocess, sys, time
import numpy as np
from kokoro_tts import Kokoro, SR

ROOT = pathlib.Path(__file__).resolve().parents[2]
JOBS = ROOT / "tools/tts/.work/jobs.json"
AUDIO = ROOT / "public/narration"
TIMINGS = ROOT / "content/generated/narration-timings.json"

# Words the dictionary would spell out letter by letter.
OVERRIDES = [
    (re.compile(r"\b(H?m{3,})\b", re.I), "hmmmm"),
    (re.compile(r"\b(R{2,}ip)\b", re.I), "ɹˈɪp"),
]

def with_overrides(text):
    for rx, ps in OVERRIDES:
        text = rx.sub(lambda m: f"[{m.group(1)}](/{ps}/)", text)
    return text

SENTENCE_END = re.compile(r"[.!?…]+[\"”]?\s+(?=[\"“]?[A-Z])")

def sentences(text):
    out, last = [], 0
    for m in SENTENCE_END.finditer(text):
        out.append(text[last:m.end()].strip())
        last = m.end()
    out.append(text[last:].strip())
    return [s for s in out if s]

def trim_bounds(wav):
    env = np.abs(wav)
    k = 240
    if len(env) > k:
        env = np.maximum.reduce([env[i:len(env) - k + i] for i in range(0, k, 24)])
    idx = np.where(env > 0.012)[0]
    if len(idx) == 0:
        return 0, len(wav)
    a = max(0, idx[0] - int(0.03 * SR))
    b = min(len(wav), idx[-1] + k + int(0.08 * SR))
    return a, b

def render(k, text, speed):
    pause_mul = 1.35 if speed < 0.8 else 1.0
    parts, words = [np.zeros(int(0.05 * SR), np.float32)], []
    t0 = 0.05
    sents = sentences(text)
    for si, sent in enumerate(sents):
        wav, toks, _ = k.synth(with_overrides(sent), speed=speed)
        a, b = trim_bounds(wav)
        seg = wav[a:b]
        off = t0 - a / SR
        cur = {"text": "", "start": None, "end": None}
        for t in toks:
            cur["text"] += t["text"]
            if t["start"] is not None:
                s0, e0 = t["start"] + off, t["end"] + off
                cur["start"] = s0 if cur["start"] is None else min(cur["start"], s0)
                cur["end"] = e0 if cur["end"] is None else max(cur["end"], e0)
            if t["ws"]:
                words.append(cur)
                cur = {"text": "", "start": None, "end": None}
        if cur["text"]:
            words.append(cur)
        parts.append(seg.astype(np.float32))
        t0 += len(seg) / SR
        if si < len(sents) - 1:
            gap = (0.5 if sent.rstrip("”\"").endswith("?") else 0.42) * pause_mul
            parts.append(np.zeros(int(gap * SR), np.float32))
            t0 += gap
    parts.append(np.zeros(int(0.12 * SR), np.float32))
    audio = np.concatenate(parts)
    # level every clip the same: RMS of the voiced part to -20 dBFS, peak <= 0.9
    voiced = audio[np.abs(audio) > 0.01]
    rms = float(np.sqrt(np.mean(voiced ** 2))) if len(voiced) else 0.1
    gain = min(0.1 / max(rms, 1e-4), 0.9 / max(float(np.max(np.abs(audio))), 1e-4))
    audio = (audio * gain).astype(np.float32)
    dur = len(audio) / SR
    # fill gaps for punctuation-only words, clamp to clip
    last = 0.05
    w_out = []
    for w in words:
        s = w["start"] if w["start"] is not None else last
        e = w["end"] if w["end"] is not None else s
        s, e = max(0.0, min(s, dur)), max(0.0, min(e, dur))
        w_out.append([round(float(s), 3), round(float(e), 3), w["text"]])
        last = e
    return audio, {"d": round(float(dur), 3), "w": w_out}

def encode_mp3(audio, path):
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
         "-c:a", "libmp3lame", "-q:a", "7", "-ar", str(SR), str(path)],
        input=audio.tobytes(), check=True)

def main():
    jobs = json.loads(JOBS.read_text())["jobs"]
    AUDIO.mkdir(parents=True, exist_ok=True)
    TIMINGS.parent.mkdir(parents=True, exist_ok=True)
    timings = json.loads(TIMINGS.read_text()) if TIMINGS.exists() else {}
    todo = [j for j in jobs if j["id"] not in timings or not (AUDIO / f"{j['id']}.mp3").exists()]
    print(f"{len(jobs)} clips, {len(todo)} to render", flush=True)
    if not todo:
        return
    k = Kokoro(voice=json.loads(JOBS.read_text())["voice"])
    t_start, audio_secs = time.time(), 0.0
    for n, j in enumerate(todo, 1):
        audio, tm = render(k, j["text"], j["speed"])
        encode_mp3(audio, AUDIO / f"{j['id']}.mp3")
        timings[j["id"]] = tm
        audio_secs += tm["d"]
        if n % 25 == 0 or n == len(todo):
            TIMINGS.write_text(json.dumps(timings, ensure_ascii=False, separators=(",", ":"), sort_keys=True))
            el = time.time() - t_start
            print(f"  {n}/{len(todo)}  {audio_secs/60:.1f} min audio in {el/60:.1f} min", flush=True)

if __name__ == "__main__":
    main()
