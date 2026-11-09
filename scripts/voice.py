"""Mira's trailer lines in her own voice (MiMo Chloe), through the dashboard's MiMo code so the key
never leaves ~/.ai-os/secrets.json. Writes public/audio/vo-<id>.wav and public/audio/vo.json (durations).
Cached: delete a wav to regenerate that line. Usage: python scripts/voice.py"""
import json
import sys
import time
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path.home() / "ai-os" / "dashboard"))
import assistant  # noqa: E402

# her usual voice, directed a little more like a trailer: confident, warm, a smile in it
assistant.MIMO["style"] = ("A bright, warm, confident young anime-inspired AI companion narrating the trailer for the operating "
                           "system she runs. Clear, crisp, a smile in the voice, a little playful and proud; lively trailer "
                           "pacing with natural pauses, never shouting, never monotone.")

LINES = [
    ("boot", "Booting up... Oh! Hi. I'm Mira."),
    ("map", "This is Leon's whole world. Every project, every file, every routine. One living map."),
    ("work", "Ask me anything. I read the code, run the scripts, and show you exactly what I'm doing."),
    ("team", "Big job? I call in the team. Lead plans, coder builds, researcher digs. And they all report back."),
    ("guard", "Small fixes just land. Anything critical waits for Leon. And it's all one click to undo."),
    ("fun", "I talk. I listen. I even dress up."),
    ("outro", "Mira OS. Built in two days. Imagine what's next."),
]

out = HERE / "public" / "audio"
out.mkdir(parents=True, exist_ok=True)
meta = {}
for lid, text in LINES:
    path = out / f"vo-{lid}.wav"
    if not path.exists():
        for attempt in range(4):
            try:
                path.write_bytes(assistant.mimo_speak(text, "mimo:Chloe"))
                break
            except Exception as e:
                print(f"{lid}: attempt {attempt + 1} failed ({type(e).__name__}); retrying", flush=True)
                time.sleep(3 * (attempt + 1))
        else:
            sys.exit(f"could not voice {lid}")
    with wave.open(str(path)) as w:
        meta[lid] = {"text": text, "file": f"audio/vo-{lid}.wav", "seconds": round(w.getnframes() / w.getframerate(), 3), "rate": w.getframerate()}
    print(f"{lid}: {meta[lid]['seconds']}s  {text}", flush=True)
(out / "vo.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
