# Mira OS trailer (dev log 01)

A 72 s, 1920x1080, 30 fps trailer for the Mira OS, built with Remotion. Nothing in it is a mock-up:
Mira is filmed from the running dashboard (her real VRM avatar, starship bridge), the Command centre
is the real brain graph of Leon's workspace, her voice is MiMo Chloe through the dashboard's own code,
and the music and sound design are synthesised from scratch - no samples, no stock footage.

Finished film: `out/mira-os-trailer.mp4` (h264 + aac, 1920x1080, 30 fps, 72.04 s, 10.2 Mbps, 92 MB).
The finished film is published as the GitHub release `v1.0` of this repo, not committed to git.

## Where things live
- `src/timeline.ts` - THE EDIT, in seconds. One source of truth for the section times and the voice starts.
- `src/Trailer.tsx` - the composition: ten sections on the timeline, the mix, the grain and the captions.
- `src/scenes.tsx` - one component per section: Boot, LogoSlam, MapScene, WorkScene, TeamScene, GuardScene, StopScene, Montage, Outro, Title.
- `src/fx.tsx` - the look: grain, scanlines, vignette, the caption track, callouts, the comm feed.
- `src/Root.tsx` - every composition and still in the repo (the trailer, two thumbnails, two channel-avatar stills, two vertical Shorts).
- `src/captions.json` - caption timings, written by `scripts/captions.py`.
- `scripts/capture.py` - films Mira, frame by frame, out of the live dashboard.
- `scripts/capture_map.py` - films the brain map (orbit, rings, areas).
- `scripts/voice.py` - her lines (MiMo Chloe). The script of the trailer is at the top of this file.
- `scripts/tighten.py` - trims the pauses and computes the per-frame mouth level.
- `scripts/score.py` - the score, the sound design and the final mix.
- `scripts/captions.py` - caption timings from the voice.
- `scripts/probe.py` - "can a headless browser even render Mira?" smoke test.
- `scripts/avatar_capture.py` - the channel-avatar stills (a smile, a peace-sign wink) at 2x.
- `scripts/short_*.py`, `scripts/chaos_*.py` - the two vertical Shorts (see below).
- `public/footage/` - the captured clips. Gitignored: rebuild with `capture.py` and `capture_map.py`.
- `public/audio/` - her voice (`vo-*.wav`, `vo-*.tight.wav`, `vo.json`) and the mix (`mix.wav`, `stem-*.wav`). The big wavs are gitignored: rebuild with `score.py`.
- `out/` - the renders. Gitignored.

## The pipeline, in the order it has to run
The dashboard must be running on http://127.0.0.1:4321 for every capture step.

1. `python scripts/voice.py` - her lines, through the dashboard's own MiMo code, so the key never
   leaves `~/.ai-os/secrets.json`. Cached: delete a `public/audio/vo-<id>.wav` to redo one line.
2. `python scripts/tighten.py` - trims the ends of every line, shortens long pauses to 0.28 s, levels
   to -1 dBFS and writes the per-frame mouth level (30 fps) that the capture drives her lips with.
3. `python scripts/capture.py [shot ...]` - films Mira. Shots: boot, work, talk-map, talk-team,
   talk-guard, talk-fun, outro, look1-6. Existing mp4s are skipped.
4. `python scripts/capture_map.py` - films the brain map.
5. `python scripts/score.py` - the music, the sound design and the mix.
6. `python scripts/captions.py` - caption timings.
7. `npm run render` - the film (`npm run studio` to edit it live).

## The three tricks that made it work
**1. The virtual clock (scripts/capture.py).** A real-time capture of a 3D avatar is never 30 fps:
the browser renders as fast as it can, so the film speeds up and her mouth slides off the words.
So the capture takes the clock away from the page. `PAGE_SETUP` replaces `performance.now` with
`window.__cap.clock` and pins the avatar canvas to `position: fixed` at 1920x1080 (the live render
loop only draws while the canvas has an offsetParent, so it would otherwise stop). `STEP` then
advances the rig by exactly one frame at a time - `miraAvatar.debug.step(1, 1/30)` - and returns one
JPEG data URL per frame. The film is therefore at true video speed however slow the capture runs.

**2. The mouth follows the audio (scripts/tighten.py -> capture.py).** `tighten.py` measures the
loudness of each tightened line frame by frame and stores it in `vo.json` as `levels`. The capture
writes that number into `C.level` for every frame, so her lips move with the exact recording of her
own voice, not with an approximation. Re-record a line and the mouth follows automatically.

**3. The map shot hides everything private (scripts/capture_map.py).** The brain map is the real
graph of Leon's workspace, so the side panels (tasks, needs-you, runs), the header, the toolbar and
the chat are hidden before anything is recorded. Only the graph is filmed.

## The score (scripts/score.py)
Synthesised from scratch with numpy and scipy - there is not one sample in it:
a generated stereo reverb impulse, a drum kit (kick, snare, clap, hat, crash), the instruments
(supersaw, pluck, bass, lead) and the one-shots (riser, impact, whoosh, blip, tick, glitch, heartbeat).
The arrangement is laid over the same section times as the edit. The mix ducks the music about
8 dB under her voice (80 ms attack, 350 ms release) and the effects dip a little with it.
It writes `public/audio/mix.wav` plus the music, sfx and vo stems.

## The Shorts (the same machine, vertical)
- `short-agents` - "Mira Explains #1: AI agents", 1080x1920. `short_capture.py`, `short_voice.py`,
  `short_score.py`.
- `short-chaos` - "Chaos Chess #1: The king fell", 1080x1920, built from the real Chaos replay on
  firechess.com: `chaos_pieces.py` steps through the match and downloads the art of every square,
  `chaos_capture.py` films her through every line, `chaos_voice.py`, `chaos_words.py` (faster-whisper
  word times), `chaos_score.py`.

## Rules for anyone working in this repo
- The Mira OS (`~/ai-os`) is the source of the avatar, the voice and the map. Do not copy its code
  here: the scripts import it (`sys.path.insert(0, ~/ai-os/dashboard); import assistant`).
- The TTS key stays in the dashboard's secrets file. Never write it here, not even in a draft.
- Nothing private in the footage. The map shot hides the panels for a reason; keep it that way.
- The section times live in `src/timeline.ts`; `scripts/score.py` and `scripts/captions.py` hold
  their own copy of the voice start times. Change one, change all three, or the music and the
  captions drift off the film.
- Big media stays out of git. The footage, the mix and the stems are rebuilt by the scripts above.
- The render needs `public/audio/mix.wav` and the captured mp4s to exist first.

## Gotchas that cost time
- Chromium must have a real GPU context for the VRM avatar: launch it with
  `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist`. A plain software rasteriser gives no WebGL.
- The capture waits for `window.miraAvatar.debug` (up to 120 s) and then 4 s for the outfit and hair
  donors to load, plus 45 settle frames, or her hair arrives mid-shot.
- The capture is slow by nature: one frame is drawn, encoded to JPEG and written at a time.
- Re-record a line and you must re-run `tighten.py`, or the mouth level no longer matches the audio.
- Captions come from the loudness of the tightened lines: a line that never pauses has one caption.
- `npm run render` overwrites `out/mira-os-trailer.mp4`; the frames are gone after the render.
- The three timing copies (`src/timeline.ts`, `scripts/score.py`, `scripts/captions.py`) are the
  most common thing to get out of step after a change.
