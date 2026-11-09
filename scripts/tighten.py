"""Tighten Mira's lines for trailer pacing: trim the ends, shorten long pauses to 0.28 s, level to -1 dBFS.
Writes public/audio/vo-<id>-tight.wav (48 kHz mono) and the per-frame mouth level (30 fps) the capture uses."""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import resample_poly

HERE = Path(__file__).resolve().parent.parent
AUD = HERE / "public" / "audio"
SR, FPS = 48000, 30
meta = json.loads((AUD / "vo.json").read_text(encoding="utf-8"))

for lid, m in meta.items():
    with wave.open(str(HERE / "public" / m["file"])) as w:
        rate = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    x = resample_poly(x, SR, rate)
    win = int(SR * 0.02)
    env = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same"))
    loud = env > 0.018
    idx = np.where(loud)[0]
    x = x[max(0, idx[0] - int(0.04 * SR)): idx[-1] + int(0.12 * SR)]
    loud = loud[max(0, idx[0] - int(0.04 * SR)): idx[-1] + int(0.12 * SR)]
    # shorten every silent run longer than 0.4 s to 0.28 s, with short fades so nothing clicks
    out, i, keep, fade = [], 0, int(0.28 * SR), int(0.01 * SR)
    while i < len(x):
        if not loud[i]:
            j = i
            while j < len(x) and not loud[j]:
                j += 1
            run = j - i
            if run > 0.4 * SR:
                a, b = x[i:i + keep // 2].copy(), x[j - keep // 2:j].copy()
                a[-fade:] *= np.linspace(1, 0, fade); b[:fade] *= np.linspace(0, 1, fade)
                out += [a, b]
            else:
                out.append(x[i:j])
            i = j
        else:
            j = i
            while j < len(x) and loud[j]:
                j += 1
            out.append(x[i:j]); i = j
    y = np.concatenate(out)
    y *= 0.89 / max(1e-6, np.abs(y).max())
    y[:int(0.005 * SR)] *= np.linspace(0, 1, int(0.005 * SR))
    y[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    with wave.open(str(AUD / f"vo-{lid}-tight.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    # mouth level per video frame: loudness, eased and scaled to 0..1
    hop = SR // FPS
    lv = np.array([np.sqrt(np.mean(y[k:k + hop] ** 2)) for k in range(0, len(y), hop)])
    lv = np.clip(lv / (np.percentile(lv[lv > 0.01], 90) if (lv > 0.01).any() else 1), 0, 1) ** 0.8
    m["tight"] = f"audio/vo-{lid}-tight.wav"
    m["tightSeconds"] = round(len(y) / SR, 3)
    m["levels"] = [round(float(v), 3) for v in lv]
    print(f"{lid}: {m['seconds']:.2f}s -> {m['tightSeconds']:.2f}s")
(AUD / "vo.json").write_text(json.dumps(meta), encoding="utf-8")
