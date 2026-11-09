"""Chaos Chess Short #1, "The king fell": her lines (MiMo Chloe, through the dashboard's MiMo code so the key never leaves
~/.ai-os/secrets.json), tightened for Shorts pacing, with mouth levels per frame for the lip-synced capture.
Writes public/short-chaos/audio/<id>.wav, <id>-tight.wav and vo.json. Cached: delete a wav to redo a line.
Usage: python scripts/chaos_voice.py"""
import json
import sys
import time
import wave
from pathlib import Path

import numpy as np
from scipy.signal import resample_poly

HERE = Path(__file__).resolve().parent.parent
AUD = HERE / "public" / "short-chaos" / "audio"
AUD.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(Path.home() / "ai-os" / "dashboard"))
import assistant  # noqa: E402

assistant.MIMO["style"] = ("A bright, quick, confident young anime-inspired AI explaining something cool to a friend in a "
                           "YouTube Short. Punchy, playful, a smile in the voice, crisp consonants, short natural pauses; "
                           "never shouting, never monotone, never a newsreader.")
LINES = [
    ("hook", "This player just lost their queen. Watch what the king does next."),
    ("setup", "This is Chaos Chess. As the game goes on, you draft powers that break the rules."),
    ("fall", "Black runs a pawn down the board and crowns a queen. White takes it, and a rook takes White's queen. Down nine points."),
    ("regicide", "But White drafted Regicide. The king eats a knight, and the dead queen comes back."),
    ("horde", "Next up, Knight Horde. Two free knights, out of thin air."),
    ("knook", "And the finish: the Knook. A knight that moves like a rook. All the way up the file, and the king falls."),
    ("outro", "That was a real game, straight from the feed. Now draft your own, at chaos dot firechess dot com."),
]
# what the voice reads where the caption spelling would trip it up
SAY = {"outro": "That was a real game, straight from the feed. Now draft your own, at chaos dot fire chess dot com.",
       "knook": "And the finish: the Nook. A knight that moves like a rook. All the way up the file, and the king... falls."}
SR, FPS = 48000, 30
meta = {}
for lid, text in LINES:
    raw = AUD / f"{lid}.wav"
    if not raw.exists():
        for attempt in range(4):
            try:
                raw.write_bytes(assistant.mimo_speak(SAY.get(lid, text), "mimo:Chloe")); break
            except Exception as e:
                print(f"{lid}: attempt {attempt + 1} failed ({type(e).__name__}); retrying", flush=True); time.sleep(3 * (attempt + 1))
        else:
            sys.exit(f"could not voice {lid}")
    with wave.open(str(raw)) as w:
        rate = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    x = resample_poly(x, SR, rate)
    # trim the ends; shorten pauses over 0.35 s to 0.22 s (Shorts pacing)
    env = np.sqrt(np.convolve(x ** 2, np.ones(960) / 960, "same")); loud = env > 0.018
    idx = np.where(loud)[0]; x, loud = x[max(0, idx[0] - 1200): idx[-1] + 4800], loud[max(0, idx[0] - 1200): idx[-1] + 4800]
    out, i, keep, fade = [], 0, int(0.22 * SR), int(0.01 * SR)
    while i < len(x):
        j = i
        while j < len(x) and loud[j] == loud[i]: j += 1
        seg = x[i:j]
        if not loud[i] and j - i > 0.35 * SR:
            a, b = seg[:keep // 2].copy(), seg[-(keep // 2):].copy(); a[-fade:] *= np.linspace(1, 0, fade); b[:fade] *= np.linspace(0, 1, fade); out += [a, b]
        else:
            out.append(seg)
        i = j
    y = np.concatenate(out); y *= 0.89 / max(1e-6, np.abs(y).max())
    y[:240] *= np.linspace(0, 1, 240); y[-1440:] *= np.linspace(1, 0, 1440)
    with wave.open(str(AUD / f"{lid}-tight.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes())
    hop = SR // FPS
    lv = np.array([np.sqrt(np.mean(y[k:k + hop] ** 2)) for k in range(0, len(y), hop)])
    lv = np.clip(lv / (np.percentile(lv[lv > 0.01], 90) if (lv > 0.01).any() else 1), 0, 1) ** 0.8
    meta[lid] = {"text": text, "tight": f"short-chaos/audio/{lid}-tight.wav", "tightSeconds": round(len(y) / SR, 3), "levels": [round(float(v), 3) for v in lv]}
    print(f"{lid}: {meta[lid]['tightSeconds']:.2f}s  {text}", flush=True)
(AUD / "vo.json").write_text(json.dumps(meta), encoding="utf-8")
