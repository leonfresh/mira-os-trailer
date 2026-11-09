"""Sentence timings for the burned-in captions, from the tightened lines' loudness (30 fps frames).
A sentence starts where speech resumes after a pause; it ends where the next pause begins.
Writes src/captions.json: [{text, from, to}] in trailer frames. VO start times match scripts/score.py."""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
VO = json.loads((HERE / "public" / "audio" / "vo.json").read_text(encoding="utf-8"))
VO_AT = {"boot": 2.3, "map": 10.3, "work": 20.3, "team": 30.3, "guard": 40.1, "fun": 48.1, "outro": 58.4}
FPS = 30

out = []
for lid, start in VO_AT.items():
    text, lv = VO[lid]["text"], VO[lid]["levels"]
    sentences = [s.strip() for s in re.findall(r"[^.!?]+[.!?]+", text)]
    # speech runs separated by at least 6 quiet frames
    runs, cur, quiet = [], None, 0
    for i, v in enumerate(lv):
        if v > 0.1:
            if cur is None: cur = [i, i]
            cur[1] = i; quiet = 0
        else:
            quiet += 1
            if cur and quiet >= 6: runs.append(cur); cur = None
    if cur: runs.append(cur)
    # each sentence boundary goes to the pause nearest where it should fall by character count
    # (comma pauses can be longer than full stops, so the longest pauses alone mislead)
    s0, s1 = runs[0][0], runs[-1][1]
    gaps = [(runs[k][1], runs[k + 1][0]) for k in range(len(runs) - 1)]
    total = sum(len(s) for s in sentences)
    cuts, used = [], set()
    for k in range(1, len(sentences)):
        target = s0 + (s1 - s0) * sum(len(s) for s in sentences[:k]) / total
        best = min((g for g in range(len(gaps)) if g not in used), key=lambda g: abs((gaps[g][0] + gaps[g][1]) / 2 - target), default=None)
        if best is not None: used.add(best); cuts.append(best)
    cuts.sort()
    bounds = [s0] + [x for g in cuts for x in (gaps[g][0], gaps[g][1])] + [s1]
    base = round(start * FPS)
    for k, s in enumerate(sentences[:len(cuts) + 1]):
        a, b = bounds[2 * k], bounds[2 * k + 1]
        out.append({"id": lid, "text": s, "from": base + a, "to": base + b + 8})
    if len(cuts) + 1 < len(sentences):
        out[-1]["text"] += " " + " ".join(sentences[len(cuts) + 1:])
(HERE / "src" / "captions.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
for c in out: print(f"{c['from'] / FPS:6.2f}-{c['to'] / FPS:6.2f}  {c['text']}")
