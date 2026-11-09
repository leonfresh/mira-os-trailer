"""Mira's channel avatar: film her at 2x resolution (2160x3840 portrait) from the live dashboard, a few moments
apart (a smile, a peace sign), and save a square crop around her face from each: public/avatar/take-<n>.png.
Same look and virtual-clock stepping as the trailer capture (scripts/capture.py)."""
import base64
import io
import json
import sys
import time
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from capture import LOOK5, PAGE_SETUP, STEP  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "public" / "avatar"
OUT.mkdir(parents=True, exist_ok=True)
W, H, DPR = 1080, 1920, 2
SETUP = PAGE_SETUP.replace("width:1920px;height:1080px", f"width:{W}px;height:{H}px")
# moments: idle frames to settle, then a smile ("happy" comes with speaking idle), then poses
PLAN = [(60, {"mode": "idle", "lvl": 0.0}, None), (40, {"mode": "idle", "lvl": 0.0}, "peace"), (60, {"mode": "idle", "lvl": 0.0}, "heart")]

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": W, "height": H}, device_scale_factor=DPR, bypass_csp=True)
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
    n = 0
    for frames, st, pose in PLAN:
        states = [dict(st) for _ in range(frames)]
        if pose: states[2]["pose"] = pose
        for start in range(0, frames, 10):
            urls = pg.evaluate(STEP, states[start:start + 10])
            for k, url in enumerate(urls):
                if (start + k) % 10 == 9:                          # keep every tenth frame
                    im = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGB")
                    w, h = im.size
                    cx, cy, r = w * 0.5, h * 0.335, w * 0.36             # her face sits a third of the way down
                    im.crop((int(cx - r), int(cy - r), int(cx + r), int(cy + r))).save(OUT / f"take-{n:02d}.png"); n += 1
    print(f"{n} takes in {OUT}")
    b.close()
