"""Chaos Chess Short #1: word times for every line (faster-whisper on the tightened clips), so the board's moves,
the power cards and the captions land on the word that names them. Writes public/short-chaos/words.json:
{line: [{w, s, e}]} in seconds from the start of the line. Usage: python scripts/chaos_words.py"""
import json
from pathlib import Path

from faster_whisper import WhisperModel

BASE = Path(__file__).resolve().parent.parent / "public" / "short-chaos"
VO = json.loads((BASE / "audio" / "vo.json").read_text(encoding="utf-8"))
model = WhisperModel("medium", device="cpu", compute_type="int8")
out = {}
for lid in VO:
    segs, _ = model.transcribe(str(BASE / "audio" / f"{lid}-tight.wav"), language="en", word_timestamps=True, initial_prompt=VO[lid]["text"])
    out[lid] = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
    print(lid, " ".join(f"{w['w']}@{w['s']:.2f}" for w in out[lid]), flush=True)
(BASE / "words.json").write_text(json.dumps(out), encoding="utf-8")
