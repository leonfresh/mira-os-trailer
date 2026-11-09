"""Chaos Chess Short #1 ("The king fell"): film Mira from the live dashboard in portrait (1080x1920), one continuous lip-synced take
through every line at its place in the Short (the edit's VO times), with her speech gestures on each sentence and
a couple of poses. Same virtual-clock capture as scripts/capture.py. Writes public/short-chaos/footage/mira.mp4
and public/short-chaos/timeline.json (line times, durations, text) for the edit and the score."""
import base64
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from capture import LOOK5, PAGE_SETUP, STEP  # noqa: E402  (the trailer's capture: look, film mode, frame stepping)

HERE = Path(__file__).resolve().parent.parent
BASE = HERE / "public" / "short-chaos"
VO = json.loads((BASE / "audio" / "vo.json").read_text(encoding="utf-8"))
FPS, W, H = 30, 1080, 1920
ORDER = ["hook", "setup", "fall", "regicide", "horde", "knook", "outro"]
GAP = {"setup": 0.35, "fall": 0.4, "regicide": 0.7, "horde": 1.7, "knook": 1.9, "outro": 1.6}   # room for the board: fast-forwards before horde and knook, the king falling before the outro

# lay the lines out on the Short's clock
t, at = 0.4, {}
for lid in ORDER:
    t += GAP.get(lid, 0); at[lid] = round(t, 2); t += VO[lid]["tightSeconds"]
LENGTH = round(t + 2.6, 2)                                   # the end card holds after her last word
(BASE / "timeline.json").write_text(json.dumps({"fps": FPS, "length": LENGTH,
    "lines": {k: {"at": at[k], "seconds": VO[k]["tightSeconds"], "text": VO[k]["text"]} for k in ORDER}}, indent=1), encoding="utf-8")

# the mouth level per frame, and the frames where each sentence starts (for her speech gestures)
levels, says = {}, {}
for lid in ORDER:
    f0 = round(at[lid] * FPS)
    for i, v in enumerate(VO[lid]["levels"]): levels[f0 + i] = v
    sentences = [s.strip() for s in re.findall(r"[^.?!]+[.?!]", VO[lid]["text"])]
    quiet, k = 99, 0
    for i, v in enumerate(VO[lid]["levels"]):
        if v > 0.12 and quiet >= 6 and k < len(sentences): says[f0 + i] = sentences[k]; k += 1
        quiet = quiet + 1 if v < 0.08 else 0
POSES = {round((at["knook"] + VO["knook"]["tightSeconds"] + 0.3) * FPS): "doublePeace", round((at["outro"] + VO["outro"]["tightSeconds"] + 0.2) * FPS): "fingerHeart"}
speaking = lambda f: any(round(at[l] * FPS) - 3 <= f < round(at[l] * FPS) + len(VO[l]["levels"]) + 4 for l in ORDER)

def state(f):
    s = {"mode": "speaking" if speaking(f) else "idle", "lvl": levels.get(f, 0.0)}
    if f in says: s["say"] = says[f]
    if f in POSES: s["pose"] = POSES[f]
    return s

FRAMES = round(LENGTH * FPS)
SETUP = PAGE_SETUP.replace("width:1920px;height:1080px", f"width:{W}px;height:{H}px")

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": W, "height": H}, bypass_csp=True)
    ctx.add_init_script(f"""try {{ localStorage.setItem('aios.avatar', {json.dumps(json.dumps(LOOK5))}); localStorage.setItem('aios.page','assistant');
      localStorage.setItem('aios.voice','off'); localStorage.setItem('aios.skin','mira'); }} catch (e) {{}}""")
    pg = ctx.new_page()
    pg.goto("http://127.0.0.1:4321/", wait_until="load")
    pg.wait_for_function("window.miraAvatar && window.miraAvatar.debug", timeout=120000)
    time.sleep(4)
    pg.evaluate(f"""async () => {{ await miraAvatar.setHair({json.dumps(LOOK5['hair'])}).catch(() => false);
      miraAvatar.setLookColours({{hairRoot: {json.dumps(LOOK5['hairRoot'])}, hairTip: {json.dumps(LOOK5['hairTip'])}, suitBase: {json.dumps(LOOK5['suitBase'])}, suitTrim: {json.dumps(LOOK5['suitTrim'])}}});
      await miraAvatar.setOutfit({json.dumps(LOOK5['outfit'])}).catch(() => false); }}""")
    pg.evaluate(SETUP)
    pg.evaluate("() => window.dispatchEvent(new Event('resize'))")
    pg.evaluate("(n) => { for (let i = 0; i < n; i++) { window.__cap.clock += 1000 / 30; miraAvatar.debug.step(1, 1 / 30); } }", 45)
    still = '--still' in sys.argv
    fdir = BASE / "footage" / "frames"; shutil.rmtree(fdir, ignore_errors=True); fdir.mkdir(parents=True)
    t0, n = time.time(), 0
    for start in range(0, 60 if still else FRAMES, 10):
        for url in pg.evaluate(STEP, [state(f) for f in range(start, min(FRAMES, start + 10))]):
            (fdir / f"{n:05d}.jpg").write_bytes(base64.b64decode(url.split(",", 1)[1])); n += 1
    if still:
        shutil.copy(fdir / f"{n - 1:05d}.jpg", BASE / "footage" / "still.jpg"); print("still written"); sys.exit()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(fdir / "%05d.jpg"),
                    "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", str(BASE / "footage" / "mira.mp4")], check=True)
    shutil.rmtree(fdir)
    print(f"mira: {n} frames in {time.time() - t0:.0f}s, length {LENGTH}s", flush=True)
    b.close()
