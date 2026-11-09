"""Mira Explains #1: the Short's score and sound design, from the trailer's own synth and drum kit (scripts/score.py),
120 BPM in A minor, scored to public/short-agents/timeline.json, with Mira's lines mixed in and the music ducked
under her. Writes public/short-agents/audio/mix.wav."""
import json
import re
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent.parent
SRC = (HERE / "scripts" / "score.py").read_text(encoding="utf-8")
# the trailer's helpers, instruments and drums (everything before its arrangement), and its sound design functions
exec(SRC[SRC.index("import json"):SRC.index("# ---------- arrangement ----------")])
exec(SRC[SRC.index("# ---------- sound design ----------"):SRC.index("# cold open:")])

BASE = HERE / "public" / "short-agents"
TL = json.loads((BASE / "timeline.json").read_text(encoding="utf-8"))
L = TL["lines"]
LEN = TL["length"] + 0.6
N = int(LEN * SR)
music = np.zeros((N, 2)); sfx = np.zeros((N, 2))
A = {k: v["at"] for k, v in L.items()}
E = {k: v["at"] + v["seconds"] for k, v in L.items()}
CUT = 10 / 30
PROG_ = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G
ROOT_ = [45, 41, 48, 43]
bar = lambda s: int(s // 2) % 4

# 0:00 boot: blips and typing, a glitch as she cuts in, an impact under the title
for k, s in enumerate(np.arange(0.0, CUT, 0.06)): place(sfx, blip(1300 + 260 * (k % 4), 0.04), float(s), 0.3, (k % 3 - 1) * .4)
for s in np.arange(0.0, CUT, 0.025): place(sfx, tick(), float(s), 0.5, rng.uniform(-.5, .5))
place(sfx, glitch(0.25), CUT - 0.05, 0.5)
place(sfx, impact(1.1), CUT, 1.0)
place(music, supersaw([45, 52, 57, 64], A["act"] + 0.2, cutoff=1200, attack=0.05, detune=0.18), CUT, 0.5)

# the groove from "a chatbot answers" on; half time and a closed filter under the warning; the drop at the outro
G0, HALF0, HALF1, DROP = A["act"], A["guard"], A["outro"], A["outro"]
for b in beats(G0, LEN - 1.4):
    half = HALF0 <= b < HALF1
    beat_n = round((b - G0) / BEAT)
    if not half or beat_n % 2 == 0: place(sfx, K, b, 0.85)
    if (beat_n % 4 == 2 and not half) or (half and beat_n % 4 == 2): place(sfx, C if b >= DROP else S, b, 0.5)
    place(sfx, HO if b >= DROP and beat_n % 2 else HC, b + BEAT / 2, 0.45, 0.3)
for s in np.arange(G0, LEN - 1.4, 2.0):
    ch = PROG_[bar(s - G0)]; cut = 900 if HALF0 <= s < HALF1 else 3200 if s >= DROP else 2200
    place(music, supersaw(ch + [ch[0] + 12], 2.05, cutoff=cut, attack=0.05 if s >= DROP else 0.2), float(s), 0.4)
    for k, t in enumerate(np.arange(s, s + 2.0, BEAT / 2)):
        place(music, bass_note(ROOT_[bar(s - G0)] - 12 + (12 if k % 4 == 3 else 0), 0.22), float(t), 0.5)
# arpeggios through the loop, circling like the diagram
for k, t in enumerate(np.arange(A["loop"], E["loop"] + 0.3, BEAT / 4)):
    ch = PROG_[bar(t - G0)]; note = (ch + [ch[0] + 12])[k % 4] + 12
    place(music, pluck(note, 0.18), float(t), 0.3, 0.4 * np.sin(k * 0.8))
# the lead at the drop
t = DROP
for note, d in [(76, 0.5), (74, 0.5), (72, 0.5), (69, 1.0), (72, 0.5), (74, 1.5), (76, 0.5), (79, 1.0), (76, 1.0)]:
    place(music, lead(note, d * BEAT * 2), t, 0.32); t += d * BEAT * 2

# a hit and a whoosh on every new section
for k in ["act", "tools", "loop", "team", "guard", "outro"]:
    place(sfx, whoosh(0.45, True), A[k] - 0.38, 0.5); place(sfx, impact(0.4), A[k], 0.5)
# UI sounds on what appears on screen
def word_time(lid, w):
    text = L[lid]["text"]; i = text.lower().find(w)
    return A[lid] + (i / max(1, len(text))) * L[lid]["seconds"]
for w in ("read", "run", "search"):
    s = word_time("tools", w); place(sfx, blip(2000, 0.05), s, 0.32, .3)
    for q in np.arange(s, s + 0.6, 0.04): place(sfx, tick(), float(q), 0.32, .4)   # the tool line typing
for k, w in enumerate(("lead", "coder", "researcher")): place(sfx, blip(1500 + 200 * k, 0.08), word_time("team", w), 0.32, -.3)
place(sfx, blip(420, .22) + np.pad(blip(420, .22), (int(0.14 * SR), 0))[:int(0.22 * SR)], A["guard"] + 0.1, 0.35)   # the warning card
place(sfx, impact(0.9), A["guard"] + 2.55, 0.9)                                        # the ALWAYS stamp
place(sfx, riser(1.6, 400, 8000), DROP - 1.6, 0.35)
place(sfx, impact(1.2), DROP, 1.0)
place(sfx, glitch(0.2), E["outro"] + 0.2, 0.3)

# ---- Mira, and the mix
vo = np.zeros((N, 2)); act = np.zeros(N)
for lid, l in L.items():
    with wave.open(str(BASE / "audio" / f"{lid}-tight.wav")) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    x = hp(x, 90); place(vo, reverb(x, IR_ROOM, 0.1), l["at"], 1.0); act[int(l["at"] * SR):int(l["at"] * SR) + len(x)] = 1
duck = np.convolve(act, np.ones(int(0.08 * SR)) / int(0.08 * SR), "same")
music = reverb(music, IR_BIG, 0.16) * (1 - 0.6 * np.clip(duck, 0, 1))[:, None]
sfx = reverb(sfx, IR_BIG, 0.18) * (1 - 0.3 * np.clip(duck, 0, 1))[:, None]
mix = music * 0.55 + sfx * 0.6 + vo * 1.25
fade = np.ones(N); fs = int((LEN - 1.6) * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
mix *= fade[:, None]
env = np.convolve(np.abs(mix).max(1), np.ones(480) / 480, "same")
mix *= np.where(env > 0.5, (0.5 + (env - 0.5) / 3) / np.maximum(env, 1e-9), 1)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix *= 0.89 / np.abs(mix).max()
with wave.open(str(BASE / "audio" / "mix.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print(f"wrote mix.wav ({LEN:.1f}s)")
