"""Chaos Chess Short #1: the score and sound design, from the trailer's own synth and drum kit (scripts/score.py),
120 BPM in A minor, scored to public/short-chaos/timeline.json and words.json (the same cues as src/ShortChaos.tsx),
with Mira's lines mixed in and the music ducked under her. Writes public/short-chaos/audio/mix.wav."""
import json
import re
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent.parent
SRC = (HERE / "scripts" / "score.py").read_text(encoding="utf-8")
exec(SRC[SRC.index("import json"):SRC.index("# ---------- arrangement ----------")])
exec(SRC[SRC.index("# ---------- sound design ----------"):SRC.index("# cold open:")])

BASE = HERE / "public" / "short-chaos"
TL = json.loads((BASE / "timeline.json").read_text(encoding="utf-8"))
WD = json.loads((BASE / "words.json").read_text(encoding="utf-8"))
L = TL["lines"]
LEN = TL["length"] + 0.6
N = int(LEN * SR)
music = np.zeros((N, 2)); sfx = np.zeros((N, 2))
A = {k: v["at"] for k, v in L.items()}
E = {k: v["at"] + v["seconds"] for k, v in L.items()}
def cue(lid, w, n=0):
    hits = [x for x in WD[lid] if re.sub(r"[^a-z']", "", x["w"].lower()).startswith(w)]
    return A[lid] + hits[n]["s"]
PROG_ = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G
ROOT_ = [45, 41, 48, 43]
bar = lambda s: int(s // 2) % 4
def piece(gain=0.4, pan=0.0, s=0.0):   # a wooden piece landing: a short low thock
    place(sfx, lp(blip(260, 0.07), 1400), s, gain, pan)
def ff(a, b, s0, s1):                   # the fast-forwards: a piece sound per ply, in the TSX's spacing
    n = b - a + 1
    for k in range(n): piece(0.22, (k % 3 - 1) * .3, s0 + k * (s1 - s0) / n + 0.12)

KILL = cue("knook", "falls")
# hook: the queen goes; the king to watch
place(sfx, impact(0.7), cue("hook", "lost") + 0.2, 0.7); place(sfx, glitch(0.15), cue("hook", "lost") + 0.2, 0.3)
place(sfx, blip(880, 0.12), cue("hook", "king"), 0.3, .3)
place(music, supersaw([45, 52, 57, 64], A["setup"] - 0.2, cutoff=900, attack=0.3, detune=0.18), 0.0, 0.35)
# the rewind, then the groove
place(sfx, glitch(0.35), A["setup"] - 0.05, 0.5); place(sfx, whoosh(0.4, False), A["setup"] - 0.1, 0.5)
G0 = A["setup"] + 0.35
for b in beats(G0, LEN - 1.4):
    beat_n = round((b - G0) / BEAT); calm = A["knook"] + 3.6 <= b < KILL   # the build before the king falls
    place(sfx, K, b, 0.8 if not calm else 0.5)
    if beat_n % 4 == 2 and not calm: place(sfx, C if b >= KILL else S, b, 0.5)
    place(sfx, HO if b >= KILL and beat_n % 2 else HC, b + BEAT / 2, 0.4, 0.3)
for s in np.arange(G0, LEN - 1.4, 2.0):
    ch = PROG_[bar(s - G0)]; cut = 3200 if s >= KILL else 2000
    place(music, supersaw(ch + [ch[0] + 12], 2.05, cutoff=cut, attack=0.05 if s >= KILL else 0.2), float(s), 0.38)
    for k, t in enumerate(np.arange(s, s + 2.0, BEAT / 2)):
        place(music, bass_note(ROOT_[bar(s - G0)] - 12 + (12 if k % 4 == 3 else 0), 0.22), float(t), 0.5)
# the board
ff(1, 27, A["setup"] + 0.33, A["fall"] - 0.07)
ff(28, 39, cue("fall", "runs"), cue("fall", "crowns") - 0.33)
place(sfx, riser(0.6, 600, 5000), cue("fall", "crowns") - 0.5, 0.25); place(sfx, impact(0.5), cue("fall", "crowns") + 0.17, 0.6); place(sfx, blip(1760, 0.2), cue("fall", "crowns") + 0.17, 0.3)
for w, n in (("takes", 0), ("rook", 0)): place(sfx, impact(0.45), cue("fall", w, n) + 0.2, 0.6); piece(0.5, 0, cue("fall", w, n) + 0.2)
place(sfx, impact(1.0), cue("fall", "down", 1), 0.9); place(sfx, glitch(0.2), cue("fall", "down", 1), 0.35)
# Regicide: the card, the king eats, the queen comes back (a rising shimmer)
place(sfx, whoosh(0.45, True), cue("regicide", "regicide") - 0.6, 0.45); place(sfx, impact(0.5), cue("regicide", "regicide") - 0.25, 0.5)
piece(0.55, 0, cue("regicide", "eats") + 0.2); place(sfx, impact(0.4), cue("regicide", "eats") + 0.2, 0.5)
for k, nt in enumerate([72, 76, 79, 84]): place(music, pluck(nt, 0.4), cue("regicide", "dead") + k * 0.07, 0.45, (k - 1.5) * .3)
place(sfx, riser(0.5, 800, 8000), cue("regicide", "dead") - 0.4, 0.25)
ff(44, 59, E["regicide"] + 0.13, cue("horde", "knight") - 0.13)
# Knight Horde: the card, two knights pop in
place(sfx, whoosh(0.45, True), cue("horde", "knight") - 0.5, 0.45); place(sfx, impact(0.5), cue("horde", "knight") - 0.13, 0.5)
for k in range(2): place(sfx, impact(0.5), cue("horde", "two") - 0.07 + k * 0.08, 0.6, (-.4, .4)[k]); place(sfx, blip(1300 + 300 * k, 0.1), cue("horde", "two") + k * 0.08, 0.3, (-.4, .4)[k])
ff(61, 78, E["horde"] + 0.13, cue("knook", "knook") - 0.2)
# the Knook: the card, a charge up the file, the king falls (the drop)
place(sfx, whoosh(0.45, True), cue("knook", "knook") - 0.55, 0.45); place(sfx, impact(0.5), cue("knook", "knook") - 0.2, 0.5)
for k in range(7): place(sfx, blip(900 + 180 * k, 0.07), cue("knook", "up") + k * 0.067, 0.25, 0)
place(sfx, riser(KILL - cue("knook", "all"), 300, 9000), cue("knook", "all"), 0.45)
place(sfx, impact(1.4), KILL, 1.1); place(sfx, crash(), KILL, 0.5); place(sfx, glitch(0.3), KILL + 0.05, 0.35)
t = KILL
for note, d in [(76, 0.5), (74, 0.5), (72, 0.5), (69, 1.0), (72, 0.5), (74, 1.5), (76, 0.5), (79, 1.0), (76, 1.0)]:
    place(music, lead(note, d * BEAT * 2), t, 0.3); t += d * BEAT * 2
# outro: the end card and the URL
place(sfx, whoosh(0.4, True), cue("outro", "now") - 0.5, 0.4); place(sfx, impact(0.6), cue("outro", "now") - 0.13, 0.5)
place(sfx, blip(2000, 0.08), cue("outro", "chaos"), 0.3); place(sfx, glitch(0.2), E["outro"] + 0.2, 0.3)
for k in ["setup", "fall", "regicide", "horde", "knook", "outro"]: place(sfx, whoosh(0.35, True), A[k] - 0.3, 0.3)

# ---- Mira, and the mix
vo = np.zeros((N, 2)); act = np.zeros(N)
for lid, l in L.items():
    with wave.open(str(BASE / "audio" / f"{lid}-tight.wav")) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    x = hp(x, 90); place(vo, reverb(x, IR_ROOM, 0.1), l["at"], 1.0); act[int(l["at"] * SR):int(l["at"] * SR) + len(x)] = 1
duck = np.convolve(act, np.ones(int(0.08 * SR)) / int(0.08 * SR), "same")
music = reverb(music, IR_BIG, 0.16) * (1 - 0.6 * np.clip(duck, 0, 1))[:, None]
sfx = reverb(sfx, IR_BIG, 0.18) * (1 - 0.3 * np.clip(duck, 0, 1))[:, None]
mix = music * 0.5 + sfx * 0.6 + vo * 1.25
fade = np.ones(N); fs = int((LEN - 1.6) * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
mix *= fade[:, None]
env = np.convolve(np.abs(mix).max(1), np.ones(480) / 480, "same")
mix *= np.where(env > 0.5, (0.5 + (env - 0.5) / 3) / np.maximum(env, 1e-9), 1)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix *= 0.89 / np.abs(mix).max()
with wave.open(str(BASE / "audio" / "mix.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print(f"wrote mix.wav ({LEN:.1f}s)")
