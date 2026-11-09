"""The Mira OS trailer score and sound design, synthesised from scratch (no samples), mixed with Mira's lines.

120 BPM synthwave in A minor (Am F C G), 72 s, arranged to the edit (the same times are in src/timeline.ts):
  0-6    boot: drone, sub heartbeat, boot beeps and typing, riser
  6-10   logo: impact, big chord, arp
  10-20  map: groove in               20-30 work: backbeat, brighter arp        30-40 team: claps, open hats
  40-48  guardrails: filter closes, half time
  48-52  stop-down: the beat drops out under "I talk. I listen. I even dress up." with a riser
  52-58  the drop on "...up": full kit, lead melody, the look montage
  58-64.5 outro: breakdown under her sign-off
  64.5   title: final hit and chord, tail, tape stop
The music ducks under her voice. Writes public/audio/mix.wav (48 kHz stereo) plus music/sfx/vo stems.
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, lfilter, fftconvolve

HERE = Path(__file__).resolve().parent.parent
AUD = HERE / "public" / "audio"
SR, BPM, LEN = 48000, 120, 72.0
BEAT = 60 / BPM
N = int(LEN * SR)
rng = np.random.default_rng(7)
# section starts (seconds)
LOGO, MAP, WORK, TEAM, GUARD, STOP, DROP, OUTRO, TITLE = 6.0, 10.0, 20.0, 30.0, 40.0, 48.0, 52.0, 58.0, 64.5
VO_AT = {"boot": 2.3, "map": 10.3, "work": 20.3, "team": 30.3, "guard": 40.1, "fun": 48.1, "outro": 58.4}

music = np.zeros((N, 2)); sfx = np.zeros((N, 2))


def t_(n): return np.arange(n) / SR
def at(s): return int(round(s * SR))
def hz(note): return 440.0 * 2 ** ((note - 69) / 12)          # MIDI note -> Hz
def lp(x, f, order=2): return sosfilt(butter(order, min(f, SR / 2 - 100) / (SR / 2), "low", output="sos"), x, axis=0)
def hp(x, f, order=2): return sosfilt(butter(order, f / (SR / 2), "high", output="sos"), x, axis=0)
def bp(x, lo, hi): return sosfilt(butter(2, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], "band", output="sos"), x, axis=0)
def env_adsr(n, a=.005, d=.1, s=.6, r=.1):
    e = np.ones(n) * s
    ai, di, ri = max(1, at(a)), max(1, at(d)), max(1, at(r))
    e[:ai] = np.linspace(0, 1, ai)[:n]
    if ai < n: e[ai:ai + di] = np.linspace(1, s, di)[:max(0, min(di, n - ai))]
    e[-ri:] *= np.linspace(1, 0, min(ri, n))
    return e
def saw(f, n, phase=0.0):
    ph = (np.cumsum(np.broadcast_to(f, (n,)) / SR) + phase) % 1.0
    return 2 * ph - 1
def place(buf, x, start, gain=1.0, pan=0.0):
    s = at(start)
    if s >= len(buf): return
    x = x[:len(buf) - s]
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l, x * r], 1) * np.sqrt(2)
    buf[s:s + len(x)] += x * gain

# ---------- reverb: a generated stereo impulse response ----------
def ir(seconds=2.4, damp=3.2):
    n = at(seconds); t = t_(n); e = np.exp(-damp * t)
    l = lp(rng.standard_normal(n) * e, 7000); r = lp(rng.standard_normal(n) * e, 6500)
    return np.stack([l, r], 1) / np.sqrt(np.sum(e ** 2))
IR_BIG, IR_ROOM = ir(3.2, 2.2), ir(0.9, 6.0)
def reverb(x, impulse, wet):
    if x.ndim == 1: x = np.stack([x, x], 1)
    y = np.stack([fftconvolve(x[:, 0], impulse[:, 0])[:len(x)], fftconvolve(x[:, 1], impulse[:, 1])[:len(x)]], 1)
    return x * (1 - wet) + y * wet

# ---------- drums ----------
def kick():
    n = at(0.45); t = t_(n)
    body = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-t * 28)) / SR) * np.exp(-t * 7)
    click = hp(rng.standard_normal(n), 2500) * np.exp(-t * 180) * 0.35
    return np.tanh((body + click) * 1.6) * 0.9
def snare():
    n = at(0.35); t = t_(n)
    return np.sin(2 * np.pi * 185 * t) * np.exp(-t * 22) * 0.6 + bp(rng.standard_normal(n), 1200, 9000) * np.exp(-t * 14) * 0.8
def clap():
    n = at(0.3); t = t_(n); x = bp(rng.standard_normal(n), 900, 5000)
    e = sum(np.exp(-np.maximum(t - d, 0) * 60) * (t >= d) for d in (0, .012, .024)) + np.exp(-t * 12) * 0.5
    return x * e * 0.7
def hat(open_=False):
    n = at(0.32 if open_ else 0.06); t = t_(n)
    return hp(rng.standard_normal(n), 8000) * np.exp(-t * (9 if open_ else 70)) * 0.35
def crash():
    n = at(2.6); t = t_(n)
    return hp(rng.standard_normal(n), 5000) * np.exp(-t * 1.6) * 0.45
K, S, C, HC, HO, CR = kick(), snare(), clap(), hat(), hat(True), crash()

# ---------- instruments ----------
PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G, one chord per 2 s bar from the logo on
ROOTS = [45, 41, 48, 43]
def chord_at(sec): return int((sec - LOGO) // 2) % 4

def supersaw(notes, dur, cutoff=2400, attack=0.4, voices=6, detune=0.12):
    n = at(dur); out = np.zeros((n, 2))
    for note in notes:
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune
            place(out, saw(hz(note) * 2 ** (cents / 12), n, rng.random()), 0.0, 1 / (voices * len(notes)) * 1.4, (v / (voices - 1)) * 1.6 - 0.8)
    return lp(out, cutoff, 2) * env_adsr(n, a=attack, d=0.3, s=0.85, r=0.6)[:, None]

def pluck(note, dur=0.22, cutoff=3500):
    n = at(dur); t = t_(n)
    x = saw(hz(note), n) * 0.6 + np.sign(np.sin(2 * np.pi * hz(note) * t)) * 0.25
    return lp(x * np.exp(-t * 9), cutoff) * env_adsr(n, a=.002, d=.05, s=.8, r=.05)

def bass_note(note, dur=0.24, cutoff=900):
    n = at(dur); t = t_(n)
    x = saw(hz(note), n) * 0.7 + np.sin(2 * np.pi * hz(note - 12) * t) * 0.6
    fenv = cutoff * (1 + 2.5 * np.exp(-t * 18))
    y = np.zeros(n)
    for chunk in np.array_split(np.arange(n), 4):              # a closing filter, in four steps
        y[chunk] = lp(x, fenv[chunk[0]])[chunk]
    return np.tanh(y * 1.3) * env_adsr(n, a=.003, d=.08, s=.7, r=.03)

def lead(note, dur):
    n = at(dur); t = t_(n)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 4, 0, 1)
    x = saw(hz(note) * vib, n) + saw(hz(note) * vib * 1.007, n) * 0.8
    return lp(x, 3800) * env_adsr(n, a=.01, d=.15, s=.7, r=.12) * 0.5

def beats(s, e): return list(np.arange(s, e - 1e-6, BEAT))

# ---------- arrangement ----------
# pads: a drone in the intro, chords from the logo on; closed down in the guardrails, a held swell in the
# stop-down, wide open in the drop, soft under the outro, huge on the title
place(music, supersaw([45, 52, 57], LOGO + 0.2, cutoff=700, attack=2.5, detune=0.2) * 0.9, 0.0, 0.55)
for bar in np.arange(LOGO, OUTRO + 6, 2.0):
    if STOP <= bar < DROP: continue
    cut = 2600 if bar < GUARD else 1100 if bar < STOP else 3400 if bar < OUTRO else 1500
    notes = PROG[chord_at(bar)]
    place(music, supersaw(notes + [notes[0] + 12], 2.05, cutoff=cut, attack=0.08 if DROP <= bar < OUTRO else 0.25), bar, 0.42 if bar < OUTRO else 0.62)
place(music, supersaw([41, 53, 57, 60], DROP - STOP + 0.1, cutoff=500, attack=1.5, detune=0.2), STOP, 0.35)   # the stop-down swell (F)
place(music, supersaw([45, 57, 60, 64, 69], 7.5, cutoff=3000, attack=0.02, detune=0.16), TITLE, 0.7)

# drums: groove from the map on, backbeat from the work section, claps and open hats for the team,
# half time in the guardrails, nothing in the stop-down, everything in the drop
for b in beats(MAP, STOP):
    half = b >= GUARD
    i = int(round(b / BEAT))
    if not half or i % 2 == 0: place(music, K, b, 0.95)
    place(music, HC, b + BEAT / 2, 0.5, 0.3)
    if b >= WORK and i % 2 == 1 and not half: place(music, S, b, 0.55, -0.05)
    if half and i % 4 == 2: place(music, S, b, 0.6)
    if b >= TEAM and i % 2 == 1 and not half: place(music, C, b, 0.4, 0.1)
    if b >= TEAM and not half and i % 4 == 3: place(music, HO, b + BEAT / 2, 0.45, -0.3)
    if b >= WORK and not half: place(music, HC, b + BEAT / 4, 0.18, -0.4); place(music, HC, b + 3 * BEAT / 4, 0.18, 0.4)
for b in beats(DROP, OUTRO):
    i = int(round(b / BEAT))
    place(music, K, b, 1.0)
    if i % 2: place(music, S, b, 0.6); place(music, C, b, 0.45)
    for q in range(4): place(music, HC, b + q * BEAT / 4, 0.28, (q - 1.5) * 0.25)
for fill in (WORK - 1, TEAM - 1, GUARD - 1):
    for k in range(8): place(music, S, fill + k * BEAT / 4, 0.25 + k * 0.05, (k % 2 - .5) * .4)
for k in range(16): place(music, S, DROP - 1 + k * BEAT / 8, 0.15 + k * 0.03, (k % 2 - .5) * .5)   # a roll into the drop
for c_at in (MAP, WORK, TEAM, DROP, TITLE): place(music, CR, c_at, 0.8 if c_at in (DROP, TITLE) else 0.55)

# bass: 8ths on the root, pumping; sparser in the guardrails, octave-jumping in the drop
for b in beats(MAP, OUTRO):
    if STOP <= b < DROP: continue
    for off in (0, BEAT / 2):
        tt = b + off
        if GUARD <= tt < STOP and off: continue
        note = ROOTS[chord_at(tt)] + (12 if (DROP <= tt and off) else 0)
        place(music, bass_note(note, 0.2 if tt >= DROP else 0.22, 700 if GUARD <= tt < STOP else 1100), tt, 0.5)

# arp: 16ths from the logo on, brighter as it goes; out in the guardrails and stop-down, back for the outro
ARP = [0, 2, 1, 2, 0, 2, 1, 3]
for b in beats(LOGO, TITLE):
    if GUARD <= b < DROP: continue
    notes = PROG[chord_at(b)]
    for q in range(4):
        tt = b + q * BEAT / 4
        i = int(round(tt / (BEAT / 4)))
        n = notes[ARP[i % 8] % 3] + 12 * (1 + ARP[i % 8] // 3)
        bright = 1800 if tt < WORK else 3200 if tt < DROP else 4200 if tt < OUTRO else 2200
        place(music, pluck(n, 0.18, bright), tt, 0.2 if DROP <= tt < OUTRO else 0.22 if tt >= OUTRO else 0.15, ((i % 4) - 1.5) * 0.35)

# lead melody in the drop, and a quiet echo of it under the title
MEL = [(0, 76, .5), (.5, 74, .5), (1, 72, .5), (1.5, 74, .25), (1.75, 76, .75), (2.5, 79, .5), (3, 76, 1), (4, 77, .5), (4.5, 76, .5),
       (5, 74, .5), (5.5, 72, .5)]
for off, note, dur in MEL: place(music, lead(note, dur * 0.95), DROP + off, 0.34)
for off, note, dur in MEL[:6]: place(music, lead(note, dur * 0.95), TITLE + 0.5 + off, 0.12, 0.2)

# ---------- sound design ----------
def riser(dur, lo=300, hi=6000):
    n = at(dur); t = t_(n); u = t / dur
    noise = rng.standard_normal(n); out = np.zeros(n)
    for chunk in np.array_split(np.arange(n), 24):
        f = lo * (hi / lo) ** (chunk[0] / n)
        out[chunk] = bp(noise, f * 0.7, f * 1.3)[chunk]
    return (out * 0.8 + lp(saw(200 * 2 ** (3 * u), n) * 0.15, 2500)) * u ** 2
def impact(size=1.0):
    n = at(3.5); t = t_(n)
    sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.4)
    return np.tanh((sub * 1.1 + lp(rng.standard_normal(n), 3000) * np.exp(-t * 9) * 0.5) * 1.5) * size
def whoosh(dur=0.6, up=True):
    n = at(dur); u = t_(n) / dur
    noise = rng.standard_normal(n); out = np.zeros(n)
    for chunk in np.array_split(np.arange(n), 16):
        f = (500 * 12 ** (chunk[0] / n)) if up else (6000 / 12 ** (chunk[0] / n))
        out[chunk] = bp(noise, f * 0.6, f * 1.6)[chunk]
    return out * np.sin(np.pi * u) ** 1.5
def blip(f=1800, dur=0.06):
    t = t_(at(dur)); return np.sin(2 * np.pi * f * t) * np.exp(-t * 60) * 0.5
def tick():
    t = t_(at(0.018)); return hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 400) * 0.4
def glitch(dur=0.25):
    n = at(dur); x = np.zeros(n)
    for chunk in np.array_split(np.arange(n), 10):
        if rng.random() < .7: x[chunk] = np.sign(np.sin(2 * np.pi * rng.uniform(200, 2400) * t_(len(chunk)))) * rng.uniform(.2, .5)
    return lp(x, 6000)
def heartbeat():
    n = at(0.5); t = t_(n); one = np.sin(2 * np.pi * 50 * t) * np.exp(-t * 18)
    two = np.zeros(n); d = at(0.16); two[d:] = one[:n - d] * 0.7
    return np.tanh((one + two) * 1.8)

# cold open: heartbeat, boot beeps and typing, a glitch as she appears, a riser into the logo
for s in (0.2, 1.2, 2.2, 3.2, 4.2): place(sfx, heartbeat(), s, 0.8)
for k, s in enumerate(np.arange(0.35, 2.0, 0.28)): place(sfx, blip(1200 + 300 * (k % 4)), float(s), 0.35, (k % 3 - 1) * .4)
for s in np.arange(0.5, 1.9, 0.045):
    if rng.random() < .7: place(sfx, tick(), float(s + rng.uniform(0, .02)), 0.6, rng.uniform(-.5, .5))
place(sfx, glitch(0.3), 2.0, 0.5)
place(sfx, riser(3.6), LOGO - 3.6, 0.45)
place(sfx, impact(1.0), LOGO, 1.0)
place(sfx, reverb(blip(880, .5) * 2, IR_BIG, .6)[:, 0], LOGO, 0.3)
# section transitions
for s, up in ((MAP, True), (WORK, True), (TEAM, True), (GUARD, False)): place(sfx, whoosh(0.5, up), s - 0.4, 0.55)
for s in (MAP, WORK, TEAM, GUARD): place(sfx, impact(0.35), s, 0.45)
# UI sounds on the on-screen moments (src/timeline.ts)
for s in (11.2, 12.4, 13.6, 14.8): place(sfx, blip(2200, .05), s, 0.28, .3)            # map callouts
for s in np.arange(21.0, 24.5, 0.07):                                                  # tablet typing
    if rng.random() < .6: place(sfx, tick(), float(s), 0.35, .4)
for s in (31.0, 32.2, 33.4, 34.6, 35.8): place(sfx, blip(1500, .08), s, 0.3, -.3)      # cards spawning
# guardrails (src/scenes.tsx GUARD_BEATS): small fixes land, the critical card arrives and waits, approve, undo
for s in (0.25, 0.65, 1.05): place(sfx, blip(1900, .05), GUARD + s, 0.26, -.4)          # small fixes auto-applied
place(sfx, blip(420, .22) + np.pad(blip(420, .22), (at(.14), 0))[:at(.22)], GUARD + 2.4, 0.32)   # the critical card: a two-tone alert
for s in (2.9, 3.3, 3.7): place(sfx, blip(2400, .04), GUARD + s, 0.22, .3)               # its checks
place(sfx, blip(660, .12) + np.pad(blip(990, .12), (at(.08), 0))[:at(.12)], GUARD + 4.4, 0.4)   # approve chime
place(sfx, glitch(0.18), GUARD + 6.8, 0.35)                                              # undo
# stop-down: a tape-stop drop-out into it, soft sub pulses, a riser into the drop
place(sfx, whoosh(0.8, False), STOP - 0.5, 0.5)
for s in (STOP + 0.0, STOP + 1.0, STOP + 2.0, STOP + 3.0): place(sfx, heartbeat(), s, 0.22)
place(sfx, riser(2.6, 400, 9000), DROP - 2.6, 0.3)
place(sfx, impact(1.1), DROP, 1.0)
for s in np.arange(DROP + 1.0, OUTRO, 1.0): place(sfx, whoosh(0.35, bool(int(s) % 2)), float(s) - 0.12, 0.35)  # montage cuts
place(sfx, whoosh(1.2, False), OUTRO - 0.5, 0.4)
place(sfx, riser(1.4, 500, 7000), TITLE - 1.4, 0.35)
place(sfx, impact(1.25), TITLE, 1.1)
place(sfx, reverb(glitch(0.2), IR_ROOM, 0.4)[:, 0], 70.2, 0.25)

# ---------- voice and mix ----------
vo = np.zeros((N, 2)); vo_active = np.zeros(N)
meta = json.loads((AUD / "vo.json").read_text(encoding="utf-8"))
for lid, start in VO_AT.items():
    with wave.open(str(HERE / "public" / meta[lid]["tight"])) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    x = hp(x, 90)
    place(vo, reverb(x, IR_ROOM, 0.12), start, 1.0)           # a short room so she sits in the mix
    vo_active[at(start):at(start) + len(x)] = 1
# duck the music under her voice (about -8 dB, 80 ms attack, 350 ms release); the effects dip a little
duck = np.convolve(vo_active, np.ones(at(0.08)) / at(0.08), "same")
rel = lfilter([1 - np.exp(-1 / (0.35 * SR))], [1, -np.exp(-1 / (0.35 * SR))], duck)
duck = np.maximum(duck, rel)
gain = 1 - 0.62 * np.clip(duck, 0, 1)
pump = np.ones(N)                                              # sidechain pump from the kick
for b in beats(MAP, OUTRO):
    if STOP <= b < DROP: continue
    s = at(b); n = at(0.3); pump[s:s + n] = np.minimum(pump[s:s + n], 0.45 + 0.55 * np.linspace(0, 1, n) ** 0.6)
music = reverb(music, IR_BIG, 0.18) * (gain * pump)[:, None]
sfx = reverb(sfx, IR_BIG, 0.22) * (1 - 0.35 * np.clip(duck, 0, 1))[:, None]
bed = music * 0.55 + sfx * 0.6
fade = np.ones(N); fs = at(68.5); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
mix = (bed + vo * 1.2) * fade[:, None]
for a_, b_, name_ in [(0, 6, "boot"), (10, 20, "map"), (20, 30, "work"), (30, 40, "team"), (40, 48, "guard"), (48, 52.5, "stop"), (58, 64.5, "outro")]:
    s_, e_ = at(a_), at(b_); on_ = vo_active[s_:e_] > 0
    r_ = lambda x: 20 * np.log10(np.sqrt(np.mean(x[on_] ** 2)) + 1e-9)
    print(f"{name_:6s} voice over bed while she speaks: {r_(vo[s_:e_] * 1.2) - r_(bed[s_:e_]):+.1f} dB")
# the tape stop on the last second and a half
ts = at(70.4); seg = mix[ts:].copy(); m = len(seg)
idx = np.clip(np.cumsum(np.linspace(1, 0.05, m)), 0, m - 1).astype(int)
mix[ts:] = seg[idx] * np.linspace(1, 0, m)[:, None]
# master: gentle bus compression and a soft limiter to -1 dBFS
env = np.convolve(np.abs(mix).max(1), np.ones(at(0.01)) / at(0.01), "same")
mix *= np.where(env > 0.5, (0.5 + (env - 0.5) / 3) / np.maximum(env, 1e-9), 1)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.89 / np.abs(mix).max()

def write(name, x):
    with wave.open(str(AUD / name), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
write("mix.wav", mix)
write("stem-music.wav", music * 0.55 * 0.8 / max(1e-9, np.abs(music * 0.55).max()))
write("stem-sfx.wav", sfx * 0.6 * 0.8 / max(1e-9, np.abs(sfx * 0.6).max()))
write("stem-vo.wav", vo)
print(f"mix.wav {LEN}s, peak {np.abs(mix).max():.2f}")
