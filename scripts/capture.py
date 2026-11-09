"""Film Mira for the trailer, frame by frame, from the live dashboard (http://127.0.0.1:4321).

The avatar's own animation loop is paused and every frame is stepped at exactly 1/30 s on a virtual
clock (performance.now is replaced), so poses, blinks, the tablet's typing and the lip sync all run at
true video speed however slow the capture is. The mouth follows the tightened voice clips' loudness.
Each shot is written as JPEG frames, then encoded to public/footage/<shot>.mp4 (h264, near lossless).

Usage: python scripts/capture.py [shot ...]      (no args: every shot; existing mp4s are skipped)
"""
import base64
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent.parent
FOOT = HERE / "public" / "footage"
VO = json.loads((HERE / "public" / "audio" / "vo.json").read_text(encoding="utf-8"))
FPS = 30
LOOK5 = {"background": "bridge", "intensity": "lively", "gestures": True, "follow": False, "outfit": "projection", "hair": "may",
         "tights": "wine", "hairRoot": "#f4e6b3", "hairTip": "#ff75bf", "suitBase": "#2e2a6e", "suitTrim": "#46d3de"}

CODE = """// mira-holo.ts: the tablet shows what she is doing
export function toolScreen(tool: string) {
  if (!tool) return 0;
  if (/web|fetch|search/i.test(tool)) return 1;
  if (/board|task|delegate/i.test(tool)) return 4;
  if (/bash|shell|git|run/i.test(tool)) return 3;
  return 2;                     // code
}

const glow = (d: number, w: number, k: number) =>
  smoothstep(w, 0, d) + Math.exp(-d * k) * 0.35;"""


def speech_plan(lid, offset):
    """Frames where each sentence of a line starts (for speech gestures) and the mouth level per frame."""
    levels = VO[lid]["levels"]
    text = VO[lid]["text"]
    sentences = [s.strip() + p for s, p in zip(__import__("re").split(r"[.!?]", text), __import__("re").findall(r"[.!?]", text)) if s.strip()]
    starts, quiet, k = [], 99, 0
    for i, v in enumerate(levels):
        if v > 0.12 and quiet >= 6 and k < len(sentences):
            starts.append((offset + i, sentences[k])); k += 1
        quiet = quiet + 1 if v < 0.08 else 0
    return {offset + i: v for i, v in enumerate(levels)}, starts


# ---- shots: name -> (frames, setup(page), per-frame state(frame) -> dict) ----
def talk_shot(lid, offset, frames, extra=None):
    lv, starts = speech_plan(lid, offset)
    def state(f):
        s = {"mode": "speaking" if offset - 3 <= f < offset + len(VO[lid]["levels"]) + 4 else "idle", "lvl": lv.get(f, 0.0)}
        for at, sentence in starts:
            if f == at:
                s["say"] = sentence
        if extra:
            s.update(extra(f) or {})
        return s
    return frames, state

SHOTS = {
    # 0:02-0:10 cold open into the logo: she says hi (wave), then holds a smile behind the title
    "boot": (lambda: talk_shot("boot", 9, 240))(),
    # 0:20-0:30 working: the tablet comes up with real code being written, then a real command running
    "work": (300, lambda f: {"mode": "thinking", "lvl": 0.0,
                             "tool": ({"name": "write", "input": {"filePath": "dashboard/avatar-src/mira-holo.ts", "content": CODE}, "status": "running", "at": 1}
                                      if f < 150 else
                                      {"name": "bash", "input": {"command": "python routines/check_map.py && npm test"},
                                       "output": "map: 189 files, 221 links, 15 runs\nchecked 212 notes · 0 problems\n\n  PASS  holo screens (6)\n  PASS  swarm board (11)\n\nTests: 17 passed", "status": "completed", "at": 2})}),
    # 0:10-0:40 a comm-feed of her narrating the map, the team and the guardrails (cropped to her face)
    "talk-map": (lambda: talk_shot("map", 6, int(VO["map"]["tightSeconds"] * FPS) + 20))(),
    "talk-team": (lambda: talk_shot("team", 6, int(VO["team"]["tightSeconds"] * FPS) + 20))(),
    "talk-guard": (lambda: talk_shot("guard", 6, int(VO["guard"]["tightSeconds"] * FPS) + 20))(),
    # 0:48-0:52 the stop-down: "I talk. I listen. I even dress up." (a wink on "dress up")
    "talk-fun": (lambda: talk_shot("fun", 6, int(VO["fun"]["tightSeconds"] * FPS) + 30,
                                   lambda f: {"pose": "peace"} if f == 6 + 72 else None))(),
    # 0:54-1:02 the outro: she signs off, then a finger heart
    "outro": (lambda: talk_shot("outro", 12, 250, lambda f: {"pose": "fingerHeart"} if f == 12 + len(VO["outro"]["levels"]) + 2 else None))(),
}
# 0:48-0:54 the look montage: different stages, outfits and poses
MONTAGE = [("concert", "projection", "peace"), ("nebula", "victoria", "heart"), ("bridge", "may-ao-space", "ganbare"),
           ("concert", "may", "fingerHeart"), ("nebula", "may-navigator", "neko"), ("bridge", "projection", "doublePeace")]
for i, (bg, outfit, pose) in enumerate(MONTAGE):
    SHOTS[f"look{i + 1}"] = (70, lambda f, pose=pose: {"mode": "idle", "lvl": 0.0, "pose": pose} if f == 8 else {"mode": "idle", "lvl": 0.0})
LOOK_SETUP = {f"look{i + 1}": {"background": bg, "outfit": outfit} for i, (bg, outfit, _) in enumerate(MONTAGE)}

PAGE_SETUP = """() => {
  // film mode: the canvas fills 1920x1080 and leaves the layout (position:fixed pauses the live loop,
  // which only renders while the canvas has an offsetParent); a virtual clock drives time
  const c = document.querySelector('#mira-avatar');
  c.style.cssText = 'position:fixed;left:0;top:0;width:1920px;height:1080px;z-index:99999';
  document.body.appendChild(c);
  window.__cap = {lvl: 0, mode: 'idle', clock: performance.now(), sayId: 100};
  const realNow = performance.now.bind(performance);
  performance.now = () => window.__cap.clock;
  Object.defineProperty(C, 'level', {get: () => window.__cap.lvl, set: () => {}, configurable: true});
  Object.defineProperty(C, 'mode', {get: () => window.__cap.mode, set: () => {}, configurable: true});
  C.turnPosed = true;                                   // no automatic poses from her words; the shot list picks them
  return true;
}"""

STEP = """(states) => {
  const out = [];
  const c = document.querySelector('#mira-avatar');
  for (const s of states) {
    window.__cap.clock += 1000 / 30;
    window.__cap.lvl = s.lvl; window.__cap.mode = s.mode;
    if (s.say) { window.__cap.sayId++; C.saying = {text: s.say, id: window.__cap.sayId}; }
    if (s.tool) C.tool = {name: s.tool.name, at: s.tool.at, seen: performance.now(), input: s.tool.input, output: s.tool.output || '', status: s.tool.status};
    else if (s.mode !== 'thinking') C.tool = null;
    if (s.pose) miraAvatar.play(s.pose);
    miraAvatar.debug.step(1, 1 / 30);
    out.push(c.toDataURL('image/jpeg', 0.94));
  }
  return out;
}"""


def encode(name, frames_dir):
    out = FOOT / f"{name}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(frames_dir / "%05d.jpg"),
                    "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", str(out)], check=True)
    shutil.rmtree(frames_dir)
    return out


def main(only):
    FOOT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"])
        for name, (frames, state) in SHOTS.items():
            if only and name not in only:
                continue
            if (FOOT / f"{name}.mp4").exists() and not only:
                print(f"{name}: exists, skipped"); continue
            ctx = b.new_context(viewport={"width": 1920, "height": 1080}, bypass_csp=True)
            look = {**LOOK5, **LOOK_SETUP.get(name, {})}
            ctx.add_init_script(f"""try {{ localStorage.setItem('aios.avatar', {json.dumps(json.dumps(look))}); localStorage.setItem('aios.page','assistant');
              localStorage.setItem('aios.voice','off'); localStorage.setItem('aios.skin','mira'); }} catch (e) {{}}""")
            pg = ctx.new_page()
            pg.goto("http://127.0.0.1:4321/", wait_until="load")
            pg.wait_for_function("window.miraAvatar && window.miraAvatar.debug", timeout=120000)
            time.sleep(4)                                              # outfit and hair donors finish loading
            pg.evaluate(f"""async () => {{ await miraAvatar.setHair({json.dumps(look['hair'])}).catch(() => false);
              miraAvatar.setLookColours({{hairRoot: {json.dumps(look['hairRoot'])}, hairTip: {json.dumps(look['hairTip'])}, suitBase: {json.dumps(look['suitBase'])}, suitTrim: {json.dumps(look['suitTrim'])}}});
              await miraAvatar.setOutfit({json.dumps(look['outfit'])}).catch(() => false); }}""")
            pg.evaluate(PAGE_SETUP)
            pg.evaluate("(n) => { for (let i = 0; i < n; i++) { window.__cap.clock += 1000 / 30; miraAvatar.debug.step(1, 1 / 30); } }", 45)   # settle
            fdir = FOOT / name / "frames"
            fdir.mkdir(parents=True, exist_ok=True)
            t0, n = time.time(), 0
            for start in range(0, frames, 10):
                batch = [state(f) for f in range(start, min(frames, start + 10))]
                for url in pg.evaluate(STEP, batch):
                    (fdir / f"{n:05d}.jpg").write_bytes(base64.b64decode(url.split(",", 1)[1])); n += 1
            out = encode(name, fdir)
            shutil.rmtree(FOOT / name, ignore_errors=True)
            print(f"{name}: {n} frames in {time.time() - t0:.0f}s -> {out.name}", flush=True)
            ctx.close()
        b.close()


if __name__ == "__main__":
    main(set(sys.argv[1:]))
