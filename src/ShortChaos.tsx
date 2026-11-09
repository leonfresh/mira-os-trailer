// "Chaos Chess #1: The king fell", a YouTube Short (1080x1920) in the Mira Explains style: Mira on the bridge up top
// (a lip-synced portrait capture), a real Chaos Chess game from the FireChess feed on a big board below her, the
// powers that turned it popping as cards, word-by-word captions, flashes and glitches on the beats.
// The game is public/short-chaos/game.json (the feed's own replay frames, names hidden); line times come from
// public/short-chaos/timeline.json (chaos_capture.py) and word times from words.json (chaos_words.py), so every move,
// card and caption lands on the word that names it. Keep text out of the bottom 380 px and the right 140 px.
import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from './timeline';
import {DISPLAY, MONO, SANS} from './fonts';
import {clamp, Flash, GlitchCut, Grain, Scanlines, Vignette} from './fx';
import TL from '../public/short-chaos/timeline.json';
import WJ from '../public/short-chaos/words.json';
import GAME from '../public/short-chaos/game.json';
import TOY from '../public/short-chaos/toy.json';

const FPS = 30;
const L = TL.lines as Record<string, {at: number; seconds: number; text: string}>;
const WD = WJ as Record<string, {w: string; s: number; e: number}[]>;
const sec = (s: number) => Math.round(s * FPS);
const at = (id: string, plus = 0) => sec(L[id].at + plus);
const end = (id: string) => sec(L[id].at + L[id].seconds);
/** The frame a word starts (the n-th word in the line that starts with `w`). */
const cue = (id: string, w: string, n = 0) => {
  const hits = WD[id].filter((x) => x.w.toLowerCase().replace(/[^a-z']/g, '').startsWith(w.toLowerCase()));
  if (!hits[n]) throw new Error(`no word "${w}" in ${id}`);
  return sec(L[id].at + hits[n].s);
};
export const CHAOS_LENGTH = Math.round(TL.length * FPS);

// ---------------------------------------------------------------- captions (the outro's spoken URL shows as the URL)
type Word = {w: string; from: number; to: number};
const WORDS: Word[] = Object.entries(WD).flatMap(([id, ws]) => {
  const out: Word[] = [];
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i];
    if (id === 'outro' && w.w.toLowerCase() === 'chaos' && ws[i + 1]?.w === 'dot') {
      out.push({w: 'chaos.firechess.com', from: L[id].at + w.s, to: L[id].at + ws[ws.length - 1].e}); break;
    }
    out.push({w: w.w, from: L[id].at + w.s, to: L[id].at + w.e});
  }
  return out;
});
const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const i = WORDS.findIndex((w, k) => t >= w.from && t < Math.max(w.to, (WORDS[k + 1]?.from ?? w.to)) + 0.05 && t < w.to + 0.6);
  if (i < 0) return null;
  const chunk = Math.floor(i / 3) * 3, group = WORDS.slice(chunk, chunk + 3).filter((w) => w.from - WORDS[chunk].from < 2.5);
  return (
    <div style={{position: 'absolute', left: 40, right: 140, top: 512, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 16px', zIndex: 20}}>
      {group.map((w, k) => {
        const on = chunk + k === i, s = interpolate(t - w.from, [0, 0.12], [0.85, 1], clamp), url = w.w.includes('.com');
        return <span key={k} style={{font: `900 ${url ? 54 : 70}px ${DISPLAY}`, textTransform: url ? 'none' : 'uppercase', color: on ? C.pink : '#fff', transform: `scale(${on ? s * 1.06 : 1})`,
          textShadow: on ? `0 0 28px ${C.pink}, 0 4px 0 #000` : '0 4px 0 #000, 0 0 20px rgba(0,0,0,0.9)', WebkitTextStroke: '2px #000', display: 'inline-block'}}>{w.w}</span>;
      })}
    </div>
  );
};

// ---------------------------------------------------------------- the game
type Fr = {fen: string; from: string | null; to: string | null; label: string};
const FR = (GAME as {frames: Fr[]}).frames;
type Bd = Record<string, string>;
const files = 'abcdefgh';
const parse = (fen: string): Bd => {
  const b: Bd = {};
  fen.split('/').forEach((row, r) => { let f = 0; for (const ch of row) { if (/\d/.test(ch)) f += Number(ch); else { b[`${files[f]}${8 - r}`] = ch; f++; } } });
  return b;
};
// the feed keeps the last FEN on a king capture (the game is over); play the capture onto it
const BOARDS: Bd[] = FR.map((fr, i) => {
  const b = parse(fr.fen);
  if (i > 0 && fr.from && fr.to && fr.fen === FR[i - 1].fen) { b[fr.to] = b[fr.from]; delete b[fr.from]; }
  return b;
});
const VAL: Record<string, number> = {p: 1, n: 3, b: 3, r: 5, q: 9, k: 0};
const material = (b: Bd) => Object.values(b).reduce((s, p) => s + (p === p.toUpperCase() ? 1 : -1) * VAL[p.toLowerCase()], 0);

/** A step puts the board on `ply` at frame `at`; the move slides over `slide` frames; new pieces appear at `spawnAt`. */
type Step = {ply: number; at: number; slide: number; spawnAt?: number; ff?: boolean};
const run = (a: number, b: number, from: number, to: number): Step[] => {
  const n = b - a + 1, each = (to - from) / n;
  return Array.from({length: n}, (_, k) => ({ply: a + k, at: Math.round(from + k * each), slide: Math.max(2, Math.min(7, Math.round(each) - 1)), ff: true}));
};
const STEPS: Step[] = [
  {ply: 41, at: 0, slide: 0},
  {ply: 42, at: cue('hook', 'lost') - 4, slide: 10},                                // the hook: the rook takes White's queen
  {ply: 0, at: at('setup'), slide: 0},                                              // rewind to the start
  ...run(1, 27, at('setup') + 10, at('fall') - 2),
  ...run(28, 39, cue('fall', 'runs'), cue('fall', 'crowns') - 10),                  // the a-pawn runs
  {ply: 40, at: cue('fall', 'crowns') - 4, slide: 9},                               // and crowns
  {ply: 41, at: cue('fall', 'takes') - 4, slide: 9},                                // White takes it
  {ply: 42, at: cue('fall', 'rook') - 2, slide: 9},                                 // a rook takes White's queen
  {ply: 43, at: cue('regicide', 'eats') - 4, slide: 10, spawnAt: cue('regicide', 'dead')},   // Regicide: Kxb2, the queen comes back
  ...run(44, 59, end('regicide') + 4, cue('horde', 'knight') - 4),
  {ply: 60, at: cue('horde', 'two') - 2, slide: 0, spawnAt: cue('horde', 'two') - 2},        // Knight Horde
  ...run(61, 78, end('horde') + 4, cue('knook', 'knook') - 6),
  {ply: 79, at: cue('knook', 'all'), slide: cue('knook', 'falls') - cue('knook', 'all')},     // the Knook, e2 to e8
];
const KILL = cue('knook', 'falls');
const stepAt = (frame: number) => { let k = 0; for (let i = 0; i < STEPS.length; i++) if (STEPS[i].at <= frame) k = i; return k; };

const SQ = 100, BOARD = 800, BX = 78, BY = 652;
const xy = (sq: string): [number, number] => [files.indexOf(sq[0]) * SQ, (8 - Number(sq[1])) * SQ];
// the pieces as the Chaos replay draws them on each position (chaos_pieces.py): the chaos-toy set and the power sculpts;
// a sculpt the site does not serve falls back to the plain toy piece
type Look = {art: string | null; badge: string | null; powers: string | null};
const TOYS = TOY as unknown as {plies: Record<string, Look>[]; files: string[]};
const LOOKS = TOYS.plies, FILES = new Set(TOYS.files);
const plain = (p: string) => `${p === p.toUpperCase() ? 'w' : 'b'}${p.toUpperCase()}.svg`;
const pieceSrc = (p: string, ply?: number, sq?: string) => {
  const art = ply !== undefined && sq ? LOOKS[ply]?.[sq]?.art : null;
  return staticFile(`short-chaos/toy/${art && FILES.has(art) && art[0] === plain(p)[0] ? art : plain(p)}`);
};

const Ring: React.FC<{sq: string; from: number; color: string; len?: number; size?: number}> = ({sq, from, color, len = 18, size = 2.4}) => {
  const frame = useCurrentFrame(), k = (frame - from) / len;
  if (k < 0 || k > 1) return null;
  const [x, y] = xy(sq), r = SQ * (0.4 + size * Easing.out(Easing.cubic)(k));
  return <div style={{position: 'absolute', zIndex: 7, left: x + SQ / 2 - r, top: y + SQ / 2 - r, width: r * 2, height: r * 2, borderRadius: '50%',
    border: `${10 * (1 - k)}px solid ${color}`, opacity: 1 - k, boxShadow: `0 0 40px ${color}`}} />;
};
const Sparks: React.FC<{sq: string; from: number; color: string; n?: number; len?: number; spread?: number}> = ({sq, from, color, n = 14, len = 24, spread = 220}) => {
  const frame = useCurrentFrame(), k = (frame - from) / len;
  if (k < 0 || k > 1) return null;
  const [x, y] = xy(sq);
  return <>{Array.from({length: n}, (_, i) => {
    const a = random(`a${sq}${from}${i}`) * Math.PI * 2, d = spread * (0.4 + 0.6 * random(`d${sq}${from}${i}`)) * Easing.out(Easing.cubic)(k), s = 10 + 12 * random(`s${sq}${from}${i}`);
    return <div key={i} style={{position: 'absolute', zIndex: 7, left: x + SQ / 2 + Math.cos(a) * d - s / 2, top: y + SQ / 2 + Math.sin(a) * d - s / 2 + 120 * k * k,
      width: s, height: s, borderRadius: 3, background: color, opacity: 1 - k, boxShadow: `0 0 12px ${color}`, transform: `rotate(${a * 60}deg)`}} />;
  })}</>;
};

const Board: React.FC = () => {
  const frame = useCurrentFrame();
  const k = stepAt(frame), st = STEPS[k], prevSt = STEPS[Math.max(0, k - 1)];
  const cur = BOARDS[st.ply], prev = k > 0 ? BOARDS[prevSt.ply] : cur, fr = FR[st.ply];
  const single = k > 0 && prevSt.ply === st.ply - 1;
  const p = st.slide ? interpolate(frame - st.at, [0, st.slide], [0, 1], {...clamp, easing: st.ply === 79 ? Easing.bezier(0.6, 0, 0.9, 1) : Easing.bezier(0.3, 0.9, 0.3, 1)}) : 1;
  const mover = single && fr.from && fr.to ? fr.to : null;
  const spawned = single ? Object.keys(cur).filter((sq) => sq !== mover && prev[sq] !== cur[sq]) : [];
  const spawnFrom = st.spawnAt ?? st.at;
  const captured = mover && prev[mover] && prev[mover] !== cur[mover] ? prev[mover] : null;
  const shake = frame >= KILL && frame < KILL + 20 ? (1 - (frame - KILL) / 20) * 22 : 0;
  const sx = shake * (random(`sx${frame}`) - 0.5) * 2, sy = shake * (random(`sy${frame}`) - 0.5) * 2;
  const rewind = frame >= at('setup') && frame < at('setup') + 10;
  return (
    <div style={{position: 'absolute', left: BX, top: BY, width: BOARD, height: BOARD, transform: `translate(${sx}px, ${sy}px)`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden', boxShadow: `0 0 0 10px #c9a06a, 0 12px 0 10px #8a6a3e, 0 0 80px 10px ${C.pink}33, 0 30px 70px rgba(0,0,0,0.7)`}}>
        {Array.from({length: 64}, (_, i) => {
          const fx = i % 8, ry = Math.floor(i / 8), dark = (fx + ry) % 2 === 1, name = `${files[fx]}${8 - ry}`;
          const last = single && fr.from && (fr.from === name || fr.to === name);
          return (
            <div key={i} style={{position: 'absolute', left: fx * SQ, top: ry * SQ, width: SQ, height: SQ, background: dark ? '#7e9da5' : '#efe4c5'}}>
              {last ? <div style={{position: 'absolute', inset: 0, background: 'rgba(255,117,191,0.42)', opacity: st.ff ? 0.7 : 1}} /> : null}
            </div>
          );
        })}
        {/* the Knook's path up the e-file, and the knight that has it */}
        {frame >= cue('knook', 'knight') && frame < KILL + 30 ? ['e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'].map((sq, i) => {
          const [x, y] = xy(sq), on = interpolate(frame, [cue('knook', 'up') + i * 2, cue('knook', 'up') + i * 2 + 6], [0, 1], clamp);
          const base = sq === 'e2' ? interpolate(frame, [cue('knook', 'knight'), cue('knook', 'knight') + 8], [0, 1], clamp) : on;
          return <div key={sq} style={{position: 'absolute', left: x, top: y, width: SQ, height: SQ, background: `${C.cyan}55`, opacity: base * (frame > KILL ? interpolate(frame, [KILL, KILL + 30], [1, 0], clamp) : 1),
            boxShadow: `inset 0 0 0 4px ${C.cyan}, 0 0 30px ${C.cyan}`}} />;
        }) : null}
        {/* the hook: the king to watch */}
        {frame >= cue('hook', 'king') && frame < end('hook') + 6 ? (() => {
          const [x, y] = xy('c2'), pl = 0.7 + 0.3 * Math.sin(frame * 0.4);
          return <div style={{position: 'absolute', left: x - 6, top: y - 6, width: SQ + 12, height: SQ + 12, borderRadius: '50%', border: `6px solid ${C.orange}`, boxShadow: `0 0 ${36 * pl}px ${C.orange}`,
            opacity: interpolate(frame, [cue('hook', 'king'), cue('hook', 'king') + 5], [0, 1], clamp)}} />;
        })() : null}
        {Object.entries(cur).map(([sq, pc]) => {
          const isMover = sq === mover, isSpawn = spawned.includes(sq);
          if (isSpawn && frame < spawnFrom) return null;
          let [x, y] = xy(sq), lift = 0, scale = 1, filter = 'drop-shadow(0 3px 2px rgba(0,0,0,0.4))';
          if (isMover && fr.from) {
            const [x0, y0] = xy(fr.from);
            x = x0 + (x - x0) * p; y = y0 + (y - y0) * p; lift = Math.sin(p * Math.PI) * (st.ff ? 4 : 14);
            if (st.ply === 79 && p < 1) filter = `drop-shadow(0 0 22px ${C.cyan}) drop-shadow(0 0 8px #fff)`;
          }
          if (isSpawn) {
            const s = spring({frame: frame - spawnFrom, fps: FPS, config: {damping: 10, stiffness: 150}});
            scale = s; filter = `drop-shadow(0 0 ${24 * (1.4 - s)}px ${C.orange}) drop-shadow(0 3px 2px rgba(0,0,0,0.4))`;
          }
          return <img key={sq} src={isMover && st.ply === 79 ? pieceSrc(pc, 78, fr.from!) : pieceSrc(pc, st.ply, sq)} style={{position: 'absolute', width: SQ, height: SQ, left: x, top: y - lift, zIndex: isMover ? 5 : 2, transform: `scale(${scale})`, filter}} />;
        })}
        {captured && mover ? (() => {
          const [x, y] = xy(mover), q = st.ply === 79 ? (frame >= KILL ? 1 : 0) : interpolate(p, [0.5, 1], [0, 1], clamp);
          if (q >= 1 && st.ply !== 79) return null;
          if (st.ply === 79 && frame >= KILL) {
            const t = (frame - KILL) / 26;   // the king topples and flies off
            return t < 1 ? <img src={pieceSrc(captured, prevSt.ply, mover)} style={{position: 'absolute', zIndex: 6, width: SQ, height: SQ, left: x + 160 * t, top: y - 140 * t + 260 * t * t,
              transform: `rotate(${t * 420}deg) scale(${1 + 0.4 * t})`, opacity: 1 - t * 0.6, filter: `drop-shadow(0 0 20px ${C.red})`}} /> : null;
          }
          return <img src={pieceSrc(captured, prevSt.ply, mover)} style={{position: 'absolute', zIndex: 1, width: SQ, height: SQ, left: x, top: y, opacity: 1 - q, transform: `scale(${1 - 0.3 * q})`}} />;
        })() : null}
        {/* hits: captures flash red, the crowned pawn and revived/spawned pieces flash gold */}
        {STEPS.filter((s) => !s.ff && s.slide > 0 && FR[s.ply].to).map((s, i) => {
          const sq = FR[s.ply].to!, hit = s.ply === 79 ? KILL : s.at + s.slide, before = BOARDS[Math.max(0, s.ply - 1)];
          const color = s.ply === 40 ? C.orange : before[sq] ? C.red : C.cyan;
          return <React.Fragment key={i}><Ring sq={sq} from={hit} color={color} size={s.ply === 79 ? 6 : 2.4} len={s.ply === 79 ? 26 : 18} />
            {before[sq] || s.ply === 40 ? <Sparks sq={sq} from={hit} color={color} n={s.ply === 79 ? 34 : 14} spread={s.ply === 79 ? 420 : 200} /> : null}</React.Fragment>;
        })}
        {STEPS.filter((s) => s.spawnAt).flatMap((s) => Object.keys(BOARDS[s.ply]).filter((sq) => sq !== FR[s.ply].to && BOARDS[s.ply - 1][sq] !== BOARDS[s.ply][sq])
          .map((sq) => <React.Fragment key={`sp${s.ply}${sq}`}><Ring sq={sq} from={s.spawnAt!} color={C.orange} /><Sparks sq={sq} from={s.spawnAt!} color={C.orange} /></React.Fragment>))}
        {rewind ? <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0 3px, transparent 3px 9px)', mixBlendMode: 'screen'}} /> : null}
      </div>
      <FastForward />
      <Material />
    </div>
  );
};

/** ">> 8x" in the board's corner while the game fast-forwards between beats. */
const FastForward: React.FC = () => {
  const frame = useCurrentFrame(), st = STEPS[stepAt(frame)];
  const rew = frame >= at('setup') && frame < at('setup') + 10;
  if (!st.ff && !rew) return null;
  return <div style={{position: 'absolute', left: 14, top: -48, font: `900 30px ${DISPLAY}`, color: rew ? C.orange : C.cyan, letterSpacing: '0.1em', textShadow: '0 3px 0 #000',
    opacity: Math.floor(frame / 6) % 2 ? 1 : 0.55}}>{rew ? '◀◀ REWIND' : `▶▶ MOVE ${Math.ceil(STEPS[stepAt(frame)].ply / 2)}`}</div>;
};

/** White's material balance, as a bar down the board's left side. */
const Material: React.FC = () => {
  const frame = useCurrentFrame(), k = stepAt(frame), st = STEPS[k];
  const a = material(BOARDS[STEPS[Math.max(0, k - 1)].ply]), b = material(BOARDS[st.ply]);
  const hitAt = st.ply === 79 ? KILL : Math.max(st.at + st.slide, st.spawnAt ?? 0), v = frame >= hitAt ? b : a;
  const pct = 50 + 50 * Math.tanh(v / 12), down = v < 0;
  const big = cue('fall', 'down', 1), stamp = spring({frame: frame - big, fps: FPS, config: {damping: 11, stiffness: 170}});
  return (
    <>
      <div style={{position: 'absolute', left: -50, top: 0, width: 30, height: BOARD, borderRadius: 8, overflow: 'hidden', background: '#16102c', boxShadow: `0 0 0 2px ${down ? C.red : C.cyan}, 0 0 20px ${down ? C.red : C.cyan}66`}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${pct}%`, background: 'linear-gradient(0deg, #ffffff, #d9d2f5)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: C.pink}} />
      </div>
      <div style={{position: 'absolute', left: -62, top: BOARD + 10, width: 56, textAlign: 'center', font: `900 26px ${MONO}`, color: down ? C.red : v > 0 ? C.green : C.text, textShadow: '0 2px 0 #000'}}>{v > 0 ? `+${v}` : v}</div>
      {frame >= big && frame < end('fall') + 6 ? (
        <div style={{position: 'absolute', left: 230, top: 280, zIndex: 12, font: `900 200px ${DISPLAY}`, color: C.red, transform: `rotate(-8deg) scale(${2.2 - 1.2 * stamp})`, opacity: stamp * interpolate(frame, [end('fall'), end('fall') + 6], [1, 0], clamp),
          textShadow: `0 0 50px ${C.red}, 0 8px 0 #000`, WebkitTextStroke: '4px #000'}}>−9</div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- the powers
const POWERS: Record<string, {icon: string; name: string; text: string; tier: string; color: string}> = {
  regicide: {icon: '👑', name: 'REGICIDE', text: 'When your king captures, revive a lost piece.', tier: 'RARE', color: C.orange},
  horde: {icon: '🐎', name: 'KNIGHT HORDE', text: 'Spawn 2 extra knights on your side.', tier: 'LEGENDARY', color: C.pink},
  knook: {icon: '🏇', name: 'THE KNOOK', text: 'One knight gains rook moves.', tier: 'RARE', color: C.cyan},
};
const PowerCard: React.FC<{id: string; from: number; to: number}> = ({id, from, to}) => {
  const frame = useCurrentFrame(), pw = POWERS[id];
  if (frame < from - 1 || frame > to + 8) return null;
  const s = spring({frame: frame - from, fps: FPS, config: {damping: 12, stiffness: 160}}), out = interpolate(frame, [to, to + 8], [1, 0], clamp);
  const shine = interpolate((frame - from) % 60, [0, 30], [-40, 140], clamp);
  return (
    <div style={{position: 'absolute', left: BX + 60, top: BY + 50, width: BOARD - 120, zIndex: 15, opacity: out, transform: `translateY(${(1 - s) * -60}px) scale(${0.7 + 0.3 * s}) rotate(${(1 - s) * -6}deg)`}}>
      <div style={{position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(20,10,40,0.95), rgba(40,14,60,0.95))', border: `3px solid ${pw.color}`, borderRadius: 22,
        boxShadow: `0 0 50px ${pw.color}88, inset 0 0 50px ${pw.color}22`, padding: '24px 30px', display: 'flex', gap: 26, alignItems: 'center'}}>
        <div style={{font: `110px ${SANS}`, lineHeight: 1, filter: `drop-shadow(0 0 20px ${pw.color})`}}>{pw.icon}</div>
        <div>
          <div style={{font: `700 22px ${MONO}`, color: pw.color, letterSpacing: '0.24em'}}>WHITE DRAFTED · {pw.tier}</div>
          <div style={{font: `900 56px ${DISPLAY}`, color: '#fff', lineHeight: 1.05, marginTop: 6, textShadow: `0 0 24px ${pw.color}`}}>{pw.name}</div>
          <div style={{font: `600 28px ${SANS}`, color: C.text, marginTop: 10}}>{pw.text}</div>
        </div>
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${shine}%`, width: 80, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', transform: 'skewX(-20deg)'}} />
      </div>
    </div>
  );
};

/** Small toasts for the drafts that fly past in the fast-forwards. */
const ICONS: Record<string, string> = {"Abundance": '🌿', "Fate's Hand": '🎡', "King's Chains": '⛓️', "Regicide": '👑', "Pawn Bayonet": '🗡️', "Usurper": '🎭', "The Archbishop": '⛪',
  "The Knook": '🏇', "Phantom Rook": '👻', "Knight Horde": '🐎', "Sniper Bishop": '🎯'};
const DraftToasts: React.FC = () => {
  const frame = useCurrentFrame();
  const toasts = STEPS.filter((s) => s.ff && /chose|picked/.test(FR[s.ply].label)).map((s) => {
    const m = FR[s.ply].label.match(/^(white|black) (?:chose|picked) (.+)$/)!;
    return {at: s.at, side: m[1], name: m[2]};
  }).filter((t) => frame >= t.at && frame < t.at + 26);
  return (
    <div style={{position: 'absolute', left: BX + 120, width: BOARD - 240, top: BY + 330, zIndex: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
      {toasts.map((t) => {
        const s = spring({frame: frame - t.at, fps: FPS, config: {damping: 12, stiffness: 200}}), o = interpolate(frame, [t.at + 20, t.at + 26], [1, 0], clamp);
        return <div key={t.at} style={{font: `800 32px ${SANS}`, color: '#fff', background: t.side === 'white' ? 'rgba(30,20,60,0.92)' : 'rgba(10,6,20,0.92)', border: `2px solid ${t.side === 'white' ? C.text : C.violet}`,
          borderRadius: 14, padding: '10px 22px', opacity: o, transform: `scale(${0.6 + 0.4 * s})`, boxShadow: '0 10px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap'}}>
          <span style={{font: `700 22px ${MONO}`, color: t.side === 'white' ? C.text : C.violet, letterSpacing: '0.16em', marginRight: 12}}>{t.side.toUpperCase()} DRAFTS</span>{ICONS[t.name] ?? '✨'} {t.name}</div>;
      })}
    </div>
  );
};

const KingCaptured: React.FC = () => {
  const frame = useCurrentFrame(), s = spring({frame: frame - KILL - 4, fps: FPS, config: {damping: 10, stiffness: 140}});
  if (frame < KILL + 4 || frame > at('outro') + 8) return null;
  return <div style={{position: 'absolute', left: BX, width: BOARD, top: BY + 300, textAlign: 'center', zIndex: 16, opacity: interpolate(frame, [at('outro'), at('outro') + 8], [1, 0], clamp)}}>
    <div style={{display: 'inline-block', font: `900 92px ${DISPLAY}`, color: '#fff', lineHeight: 1, transform: `scale(${2 - s}) rotate(-4deg)`, opacity: Math.min(1, s * 1.5),
      textShadow: `0 0 40px ${C.red}, 0 6px 0 #000`, WebkitTextStroke: '3px #000'}}>KING<br />CAPTURED</div>
  </div>;
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame(), f0 = cue('outro', 'now') - 4;
  if (frame < f0) return null;
  const s = spring({frame: frame - f0, fps: FPS, config: {damping: 13, stiffness: 150}}), url = spring({frame: frame - cue('outro', 'chaos'), fps: FPS, config: {damping: 11, stiffness: 180}});
  const pl = 0.6 + 0.4 * Math.sin(frame * 0.25);
  return (
    <div style={{position: 'absolute', left: BX, top: BY, width: BOARD, height: BOARD, zIndex: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: `rgba(8,4,18,${0.82 * s})`, borderRadius: 12}}>
      <img src={staticFile('short-chaos/firechess-flame.png')} style={{width: 130, transform: `scale(${s})`, filter: `drop-shadow(0 0 30px ${C.orange})`}} />
      <div style={{font: `900 96px ${DISPLAY}`, color: '#fff', lineHeight: 1, marginTop: 16, textAlign: 'center', transform: `scale(${1.3 - 0.3 * s})`, opacity: s, textShadow: `0 0 40px ${C.pink}`}}>CHAOS<br />CHESS</div>
      <div style={{font: `700 30px ${MONO}`, color: C.pink, letterSpacing: '0.18em', marginTop: 18, opacity: s}}>DRAFT POWERS · BREAK CHESS</div>
      <div style={{marginTop: 34, font: `900 44px ${SANS}`, color: '#000', background: C.cyan, padding: '14px 30px', borderRadius: 14, transform: `scale(${url})`, boxShadow: `0 0 ${40 * pl}px ${C.cyan}`}}>chaos.firechess.com</div>
      <div style={{font: `700 26px ${MONO}`, color: C.text, marginTop: 18, opacity: url}}>FREE · IN YOUR BROWSER</div>
    </div>
  );
};

const Tag: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 60, top: 70, display: 'flex', alignItems: 'center', gap: 16, zIndex: 20}}>
      <div style={{width: 14, height: 14, borderRadius: 7, background: C.red, opacity: Math.floor(frame / 15) % 2 ? 1 : 0.3, boxShadow: `0 0 12px ${C.red}`}} />
      <div style={{font: `700 30px ${MONO}`, color: C.text, letterSpacing: '0.2em', textShadow: '0 2px 0 #000'}}>CHAOS CHESS</div>
      <div style={{font: `700 22px ${MONO}`, color: C.pink, letterSpacing: '0.14em', border: `2px solid ${C.pink}`, padding: '2px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.5)'}}>REAL GAME · NAMES HIDDEN</div>
    </div>
  );
};

// ---------------------------------------------------------------- the Short
export const ShortChaos: React.FC = () => {
  const frame = useCurrentFrame();
  const beats = ['setup', 'fall', 'regicide', 'horde', 'knook', 'outro'].map((id) => at(id));
  const push = 1.0 + 0.03 * Math.sin(frame / 90);
  const shift = beats.filter((b) => frame >= b).length % 2 ? -12 : 12;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <GlitchCut at={at('setup')} len={9}>
        <AbsoluteFill style={{transform: `translateY(-300px) scale(${push}) translateX(${shift}px)`, transformOrigin: '50% 25%'}}>
          <OffthreadVideo src={staticFile('short-chaos/footage/mira.mp4')} muted />
        </AbsoluteFill>
      </GlitchCut>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 20%, rgba(4,2,12,0.6) 27%, rgba(4,2,12,0.94) 33%, rgba(4,2,12,0.97) 100%)'}} />
      <GlitchCut at={at('setup')} len={9}><AbsoluteFill><Board /></AbsoluteFill></GlitchCut>
      <DraftToasts />
      <PowerCard id="regicide" from={cue('regicide', 'regicide') - 8} to={end('regicide')} />
      <PowerCard id="horde" from={cue('horde', 'knight') - 4} to={end('horde')} />
      <PowerCard id="knook" from={cue('knook', 'knook') - 6} to={cue('knook', 'all') - 4} />
      <KingCaptured />
      <EndCard />
      <Captions />
      <Tag />
      <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.75}}>
        {[[40, 40, 'Left', 'Top'], [40, 40, 'Right', 'Top'], [40, 40, 'Left', 'Bottom'], [40, 40, 'Right', 'Bottom']].map(([x, y, h, v], i) => (
          <div key={i} style={{position: 'absolute', [String(h).toLowerCase()]: x, [String(v).toLowerCase()]: y, width: 54, height: 54,
            [`border${h}`]: `3px solid ${C.pink}`, [`border${v}`]: `3px solid ${C.pink}`}} />))}
      </AbsoluteFill>
      {beats.map((b, i) => <Flash key={i} at={b} len={7} color={i % 2 ? C.pink : '#fff'} peak={0.3} />)}
      <Flash at={cue('hook', 'lost') + 6} len={8} color={C.red} peak={0.35} />
      <Flash at={cue('regicide', 'dead')} len={10} color={C.orange} peak={0.4} />
      <Flash at={cue('horde', 'two') - 2} len={10} color={C.orange} peak={0.35} />
      <Flash at={KILL} len={14} color="#fff" peak={0.75} />
      <Scanlines opacity={0.05} />
      <Vignette strength={0.5} />
      <Grain opacity={0.05} />
      <Audio src={staticFile('short-chaos/audio/mix.wav')} />
    </AbsoluteFill>
  );
};
