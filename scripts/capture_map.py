"""Film the Command Centre's brain map (the real graph of Leon's workspace) at 1920x1080, 30 fps.

requestAnimationFrame and performance.now are replaced so every frame is stepped at exactly 1/30 s.
Only the graph is shown: the side panels (tasks, needs-you, runs), header, toolbar and chat are hidden,
so nothing private ends up in the trailer. Writes public/footage/map-<view>.mp4.
"""
import shutil
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent.parent
FOOT = HERE / "public" / "footage"
FPS = 30
SHOTS = [("orbit", "3d orbit", 300), ("rings", "rings", 180), ("areas", "areas", 150)]

CLOCK = """
window.__raf = []; window.__vt = 0;
window.requestAnimationFrame = (cb) => { window.__raf.push(cb); return window.__raf.length; };
window.cancelAnimationFrame = () => {};
performance.now = () => window.__vt;
window.__tick = (ms) => { window.__vt += ms; const q = window.__raf; window.__raf = []; for (const cb of q) { try { cb(window.__vt); } catch (e) { console.error(e); } } };
"""
FILM_CSS = """
body > header, header.top, .col.left, .col.right, .toolbar, .legend, .stage-hint, #console, .swarm-views, .tooltip, .nodecard,
.look-modal, #toast, .toast { display: none !important; }
#brain-wrap { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; max-width: none !important; margin: 0 !important; z-index: 50; }
.stage { position: absolute !important; inset: 0 !important; height: auto !important; }
.counts { font-size: 15px !important; }
"""


def main():
    FOOT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"])
        for view, label, frames in SHOTS:
            ctx = b.new_context(viewport={"width": 1920, "height": 1080}, bypass_csp=True)
            ctx.add_init_script("try { localStorage.setItem('aios.page','home'); localStorage.setItem('aios.skin','mira'); localStorage.setItem('aios.voice','off'); } catch (e) {}\n" + CLOCK)
            pg = ctx.new_page()
            pg.goto("http://127.0.0.1:4321/", wait_until="load")
            for _ in range(60): pg.evaluate("window.__tick(33.33)")
            pg.add_style_tag(content=FILM_CSS)
            pg.evaluate("window.dispatchEvent(new Event('resize'))")
            pg.evaluate("(label) => { const b = [...document.querySelectorAll('#tabs button, #tabs *')].find(x => x.textContent.trim().toLowerCase() === label); if (b) b.click(); }", label)
            for _ in range(90): pg.evaluate("window.__tick(33.33)")          # let the layout settle and fit
            fdir = FOOT / f"map-{view}" / "frames"; fdir.mkdir(parents=True, exist_ok=True)
            t0 = time.time()
            for i in range(frames):
                pg.evaluate("window.__tick(33.33)")
                pg.screenshot(path=str(fdir / f"{i:05d}.jpg"), type="jpeg", quality=93)
            out = FOOT / f"map-{view}.mp4"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(fdir / "%05d.jpg"),
                            "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", str(out)], check=True)
            shutil.rmtree(FOOT / f"map-{view}")
            print(f"map-{view}: {frames} frames in {time.time() - t0:.0f}s", flush=True)
            ctx.close()
        b.close()


if __name__ == "__main__":
    main()
