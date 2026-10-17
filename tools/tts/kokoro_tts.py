"""Build-time only Kokoro-82M wrapper: text -> 24 kHz audio + word timings."""
import json, pathlib, re
import numpy as np
import onnxruntime as ort
import spacy
from misaki import en, espeak

HERE = pathlib.Path(__file__).parent
SR = 24000
VOCAB = {';': 1, ':': 2, ',': 3, '.': 4, '!': 5, '?': 6, '—': 9, '…': 10, '"': 11, '(': 12, ')': 13, '“': 14, '”': 15, ' ': 16, '̃': 17, 'ʣ': 18, 'ʥ': 19, 'ʦ': 20, 'ʨ': 21, 'ᵝ': 22, 'ꭧ': 23, 'A': 24, 'I': 25, 'O': 31, 'Q': 33, 'S': 35, 'T': 36, 'W': 39, 'Y': 41, 'ᵊ': 42, 'a': 43, 'b': 44, 'c': 45, 'd': 46, 'e': 47, 'f': 48, 'h': 50, 'i': 51, 'j': 52, 'k': 53, 'l': 54, 'm': 55, 'n': 56, 'o': 57, 'p': 58, 'q': 59, 'r': 60, 's': 61, 't': 62, 'u': 63, 'v': 64, 'w': 65, 'x': 66, 'y': 67, 'z': 68, 'ɑ': 69, 'ɐ': 70, 'ɒ': 71, 'æ': 72, 'β': 75, 'ɔ': 76, 'ɕ': 77, 'ç': 78, 'ɖ': 80, 'ð': 81, 'ʤ': 82, 'ə': 83, 'ɚ': 85, 'ɛ': 86, 'ɜ': 87, 'ɟ': 90, 'ɡ': 92, 'ɥ': 99, 'ɨ': 101, 'ɪ': 102, 'ʝ': 103, 'ɯ': 110, 'ɰ': 111, 'ŋ': 112, 'ɳ': 113, 'ɲ': 114, 'ɴ': 115, 'ø': 116, 'ɸ': 118, 'θ': 119, 'œ': 120, 'ɹ': 123, 'ɾ': 125, 'ɻ': 126, 'ʁ': 128, 'ɽ': 129, 'ʂ': 130, 'ʃ': 131, 'ʈ': 132, 'ʧ': 133, 'ʊ': 135, 'ʋ': 136, 'ʌ': 138, 'ɣ': 139, 'ɤ': 140, 'χ': 142, 'ʎ': 143, 'ʒ': 147, 'ʔ': 148, 'ˈ': 156, 'ˌ': 157, 'ː': 158, 'ʰ': 162, 'ʲ': 164, '↓': 169, '→': 171, '↗': 172, '↘': 173, 'ᵻ': 177}


PUNCT_TAG = {".": ".", "!": ".", "?": ".", ",": ",", ";": ",", ":": ":", "—": ":", "…": ":",
             "“": "``", "”": "''", '"': '""'}


class BlankG2P(en.G2P):
    """A blank spaCy pipeline has no tagger, so punctuation would lose its
    tags (and with them, its pauses). Tag punctuation by hand."""
    def tokenize(self, text, tokens, features):
        out = super().tokenize(text, tokens, features)
        for t in out:
            if t.text and all(c in PUNCT_TAG for c in t.text):
                t.tag = PUNCT_TAG[t.text[0]]
        return out


def make_g2p():
    """misaki English G2P with a blank spaCy tokenizer (no downloaded model)
    and espeak-ng as the fallback for words not in misaki's dictionaries."""
    g = BlankG2P.__new__(BlankG2P)
    g.version = "1.0"
    g.british = False
    g.nlp = spacy.blank("en")
    g.lexicon = en.Lexicon(False)
    g.fallback = espeak.EspeakFallback(british=False)
    g.unk = ""
    return g


class Kokoro:
    def __init__(self, voice="af_heart"):
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 4
        self.sess = ort.InferenceSession(str(HERE / "model/kokoro-dur.onnx"), opts, providers=["CPUExecutionProvider"])
        raw = (HERE / f"node_modules/kokoro-js/voices/{voice}.bin").read_bytes()
        self.voice = np.frombuffer(raw, dtype=np.float32).reshape(-1, 1, 256)
        self.g2p = make_g2p()

    def phonemize(self, text):
        ps, tokens = self.g2p(text)
        return ps, tokens

    def synth(self, text, speed=0.9):
        ps, tokens = self.phonemize(text)
        ps = "".join(c for c in ps if c in VOCAB)
        ids = [0] + [VOCAB[c] for c in ps] + [0]
        assert len(ids) <= 512, f"line too long ({len(ids)} tokens): {text}"
        style = self.voice[len(ps) - 1]
        wav, dur = self.sess.run(None, {
            "input_ids": np.array([ids], dtype=np.int64),
            "style": style.astype(np.float32),
            "speed": np.array([speed], dtype=np.float32),
        })
        wav = wav.reshape(-1)
        dur = np.rint(dur.reshape(-1)).astype(int)
        words = self.timestamps(tokens, dur)
        return wav, words, ps

    @staticmethod
    def timestamps(tokens, pred_dur):
        """Port of kokoro's join_timestamps: duration frames are 600 samples
        (1/40 s); counting half-frames lets spaces split in two."""
        DIV = 80
        out = []
        if not tokens or len(pred_dur) < 3:
            return out
        left = right = 2 * max(0, pred_dur[0] - 3)
        i = 1
        for t in tokens:
            if i >= len(pred_dur) - 1:
                break
            if not t.phonemes:
                if t.whitespace:
                    i += 1
                    left = right + pred_dur[i]
                    right = left + pred_dur[i]
                    i += 1
                continue
            j = i + len(t.phonemes)
            if j >= len(pred_dur):
                break
            start = left / DIV
            token_dur = int(pred_dur[i:j].sum())
            space_dur = int(pred_dur[j]) if t.whitespace else 0
            left = right + (2 * token_dur) + space_dur
            end = left / DIV
            right = left + space_dur
            i = j + (1 if t.whitespace else 0)
            out.append({"text": t.text, "start": round(start, 3), "end": round(end, 3)})
        return out
