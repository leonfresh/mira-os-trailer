"""Quick check: can a headless browser render Mira on the bridge at 1920x1080? Saves footage/probe.png."""
import base64, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent.parent / "public" / "footage"
LOOK5 = {"background": "bridge", "intensity": "lively", "gestures": True, "follow": False, "outfit": "projection", "hair": "may",
         "tights": "wine", "hairRoot": "#f4e6b3", "hairTip": "#ff75bf", "suitBase": "#2e2a6e", "suitTrim": "#46d3de"}

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"])
    pg = b.new_context(viewport={"width": 1920, "height": 1080}, bypass_csp=True).new_page()
    pg.add_init_script(f"""try {{ localStorage.setItem('aios.avatar', {json.dumps(json.dumps(LOOK5))}); localStorage.setItem('aios.page','assistant');
      localStorage.setItem('aios.voice','off'); localStorage.setItem('aios.skin','mira'); }} catch (e) {{}}""")
    pg.goto("http://127.0.0.1:4321/", wait_until="load")
    t0 = time.time()
    pg.wait_for_function("window.miraAvatar && window.miraAvatar.debug", timeout=120000)
    print("avatar ready in", round(time.time() - t0, 1), "s")
    print(pg.evaluate("(() => { const g = document.createElement('canvas').getContext('webgl2'); const d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a'; })()"))
    pg.evaluate("""() => { const c = document.querySelector('#mira-avatar'); c.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;z-index:99999';
      document.body.appendChild(c); }""")
    time.sleep(3)
    t1 = time.time()
    url = pg.evaluate("miraAvatar.debug.step(30, 1/30)")
    print("30 frames stepped in", round(time.time() - t1, 2), "s")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "probe.png").write_bytes(base64.b64decode(url.split(",", 1)[1]))
    b.close()
