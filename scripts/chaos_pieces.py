"""Chaos Chess Short #1: the pieces exactly as the Chaos replay draws them. Steps through the match on the live
replay page (firechess.com/chaos/replay/<id>) and records, for every square of every position, the art file it
shows (the chaos-toy set and the power sculpts) and the power badge under it; downloads each art file once.
Writes public/short-chaos/toy/<name>.svg and public/short-chaos/toy.json: {plies: [{square: {art, badge, powers}}], files}.
Usage: python scripts/chaos_pieces.py"""
import json
import shutil
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

MATCH = "1868ada3-2a85-46f9-9b92-43817c3e8671%3A0"
SITE = "https://www.firechess.com"
BASE = Path(__file__).resolve().parent.parent / "public" / "short-chaos"
OUT = BASE / "toy"
shutil.rmtree(OUT, ignore_errors=True); OUT.mkdir(parents=True, exist_ok=True)
N = len(json.loads((BASE / "game.json").read_text(encoding="utf-8"))["frames"])
READ = """() => Object.fromEntries([...document.querySelectorAll('[data-square]')].flatMap(s => {
  const pc = s.querySelector('[data-piece]'); if (!pc) return [];
  const art = [...pc.querySelectorAll('div')].map(d => d.style.backgroundImage).find(u => u && u.includes('/pieces/'));
  const badge = pc.querySelector('[aria-label^="Active powers"]');
  return [[s.dataset.square, {art: art ? art.replace(/^url\\("?|"?\\)$/g, '') : null, badge: badge ? badge.textContent.trim() : null,
    powers: badge ? badge.getAttribute('aria-label').replace('Active powers: ', '') : null}]];
}))"""
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 900, "height": 1300})
    pg.goto(f"{SITE}/chaos/replay/{MATCH}", wait_until="networkidle", timeout=90000)
    pg.wait_for_timeout(3000)
    plies, arts = [], set()
    for ply in range(N):
        if ply: pg.get_by_role("button", name="Next position").click()
        pg.wait_for_timeout(250)
        row = pg.evaluate(READ)
        for v in row.values():
            if v["art"]: arts.add(v["art"]); v["art"] = Path(v["art"]).name
        plies.append(row)
    b.close()
missing = []
for a in sorted(arts):
    try: (OUT / Path(a).name).write_bytes(urllib.request.urlopen(SITE + a).read())
    except urllib.error.HTTPError: missing.append(a)
if missing: print("the site does not serve:", ", ".join(missing))   # the video falls back to the plain toy piece for these
(BASE / "toy.json").write_text(json.dumps({"plies": plies, "files": sorted(f.name for f in OUT.glob("*.svg"))}), encoding="utf-8")
print(len(plies), "positions;", ", ".join(sorted(Path(a).name for a in arts)))
