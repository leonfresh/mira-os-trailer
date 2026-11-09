# Mira OS trailer (dev log 01)

A 72 s, 1920x1080, 30 fps trailer built with Remotion. Everything is generated from the live dashboard and
code: Mira is filmed from the real avatar (look preset 5, starship bridge), the map is the real brain graph,
her voice is MiMo Chloe, and the score and sound design are synthesised from scratch (no samples).

Output: `out/mira-os-trailer.mp4`

## Rebuild, step by step
The dashboard must be running on http://127.0.0.1:4321 for the capture steps.

1. `python scripts/voice.py` - Mira's lines through the dashboard's MiMo code (key stays in ~/.ai-os/secrets.json). Cached: delete a `public/audio/vo-*.wav` to redo one line.
2. `python scripts/tighten.py` - trims pauses, levels, and computes the per-frame mouth levels.
3. `python scripts/capture.py [shot ...]` - films Mira frame by frame (virtual clock, lip sync to step 2). Shots: boot, work, talk-map, talk-team, talk-guard, talk-fun, outro, look1-6.
4. `python scripts/capture_map.py` - films the brain map (orbit, rings, areas) with the private side panels hidden.
5. `python scripts/score.py` - the score, sound design and final mix (`public/audio/mix.wav`, plus stems).
6. `python scripts/captions.py` - caption timings from the voice.
7. `npm run render` (or `npm run studio` to edit).

## Where things are
- `src/timeline.ts` - section times; keep `scripts/score.py` and `scripts/captions.py` in step with it.
- `src/scenes.tsx` - one component per section; `src/fx.tsx` - grain, glitches, callouts, captions, comm feed.
- The script (Mira's lines) is at the top of `scripts/voice.py`.
