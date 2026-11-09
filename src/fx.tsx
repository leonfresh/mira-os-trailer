// Shared looks for the trailer: film grain, vignette, scanlines, flashes, glitch cuts, HUD corners,
// section tags, callouts, captions and Mira's comm-feed bubble.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, f} from './timeline';
import {DISPLAY, MONO, SANS} from './fonts';
import captions from './captions.json';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <svg width="100%" height="100%">
        <filter id={`g${frame % 8}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 8} /></filter>
        <rect width="100%" height="100%" filter={`url(#g${frame % 8})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) => (
  <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,${strength}) 100%)`}} />
);

export const Scanlines: React.FC<{opacity?: number}> = ({opacity = 0.08}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.9) 0 1px, transparent 1px 3px)'}} />
);

/** A flash that peaks at `at` (frame) and fades over `len` frames. */
export const Flash: React.FC<{at: number; len?: number; color?: string; peak?: number}> = ({at, len = 10, color = '#fff', peak = 0.9}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 1, at, at + len], [0, peak, 0], clamp);
  return o > 0.001 ? <AbsoluteFill style={{background: color, opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}} /> : null;
};

/** RGB-split slices around a cut: children are drawn three times, shifted, for a few frames. */
export const GlitchCut: React.FC<{at: number; len?: number; children: React.ReactNode}> = ({at, len = 6, children}) => {
  const frame = useCurrentFrame();
  const k = frame - at;
  if (k < 0 || k > len) return <>{children}</>;
  const amt = (1 - k / len) * 26;
  const bars = Array.from({length: 7}, (_, i) => ({y: random(`y${at}${i}${k}`) * 100, h: 2 + random(`h${at}${i}${k}`) * 9, dx: (random(`x${at}${i}${k}`) - 0.5) * amt * 4}));
  return (
    <AbsoluteFill>
      <AbsoluteFill>{children}</AbsoluteFill>
      <AbsoluteFill style={{transform: `translateX(${-amt}px)`, mixBlendMode: 'screen', filter: 'sepia(1) saturate(8) hue-rotate(-50deg)', opacity: 0.55}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{transform: `translateX(${amt}px)`, mixBlendMode: 'screen', filter: 'sepia(1) saturate(8) hue-rotate(150deg)', opacity: 0.55}}>{children}</AbsoluteFill>
      {bars.map((b, i) => (
        <AbsoluteFill key={i} style={{clipPath: `inset(${b.y}% 0 ${Math.max(0, 100 - b.y - b.h)}% 0)`, transform: `translateX(${b.dx}px)`}}>{children}</AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

export const HudCorners: React.FC<{color?: string; inset?: number; label?: string}> = ({color = C.cyan, inset = 48, label}) => {
  const frame = useCurrentFrame();
  const L = 46, W = 3;
  const corner = (style: React.CSSProperties) => <div style={{position: 'absolute', width: L, height: L, ...style}} />;
  const b = `${W}px solid ${color}`;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.8}}>
      {corner({left: inset, top: inset, borderLeft: b, borderTop: b})}
      {corner({right: inset, top: inset, borderRight: b, borderTop: b})}
      {corner({left: inset, bottom: inset, borderLeft: b, borderBottom: b})}
      {corner({right: inset, bottom: inset, borderRight: b, borderBottom: b})}
      {label ? (
        <div style={{position: 'absolute', right: inset + 8, top: inset + 12, font: `500 16px ${MONO}`, color, letterSpacing: '0.18em'}}>
          {label} <span style={{opacity: Math.floor(frame / 15) % 2 ? 1 : 0.2}}>●</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** "01 · THE MAP" in the top-left, sliding in with a bar. */
export const SectionTag: React.FC<{n: string; title: string; color?: string}> = ({n, title, color = C.cyan}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 200}, durationInFrames: 18});
  const out = interpolate(frame, [f(9.2), f(9.6)], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 96, top: 92, opacity: s * out, transform: `translateX(${(1 - s) * -40}px)`}}>
      <div style={{font: `700 18px ${MONO}`, color, letterSpacing: '0.3em'}}>{n}</div>
      <div style={{font: `900 58px ${DISPLAY}`, color: C.text, letterSpacing: '0.06em', marginTop: 6, textShadow: `0 0 30px ${color}66`}}>{title}</div>
      <div style={{height: 3, width: 140 * s, background: color, marginTop: 14, boxShadow: `0 0 16px ${color}`}} />
    </div>
  );
};

/** A label that pops in at `at` (frames, relative to its sequence) with a leader line to a point. */
export const Callout: React.FC<{at: number; x: number; y: number; dx?: number; dy?: number; big: string; small: string; color?: string}> = ({at, x, y, dx = 120, dy = -80, big, small, color = C.cyan}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 14, stiffness: 160}});
  const line = interpolate(frame - at, [0, 8], [0, 1], clamp);
  if (frame < at) return null;
  const lx = x + dx * line, ly = y + dy * line;
  return (
    <>
      <svg style={{position: 'absolute', inset: 0, overflow: 'visible'}} width={1920} height={1080}>
        <circle cx={x} cy={y} r={7 * s} fill="none" stroke={color} strokeWidth={2.5} />
        <circle cx={x} cy={y} r={2.5} fill={color} />
        <polyline points={`${x},${y} ${lx},${ly} ${lx + (dx > 0 ? 40 : -40) * line},${ly}`} fill="none" stroke={color} strokeWidth={2} opacity={0.9} />
      </svg>
      <div style={{position: 'absolute', left: dx > 0 ? lx + 48 : undefined, right: dx > 0 ? undefined : 1920 - lx + 48, top: ly - 34,
        opacity: s, transform: `scale(${0.8 + 0.2 * s})`, transformOrigin: dx > 0 ? 'left center' : 'right center', textAlign: dx > 0 ? 'left' : 'right'}}>
        <div style={{font: `900 46px ${DISPLAY}`, color: C.text, textShadow: `0 0 24px ${color}`}}>{big}</div>
        <div style={{font: `500 17px ${MONO}`, color, letterSpacing: '0.16em', textTransform: 'uppercase'}}>{small}</div>
      </div>
    </>
  );
};

/** Burned-in captions: the sentence Mira is saying, in a clean lower-third. */
export const Captions: React.FC<{hideBetween?: [number, number][]}> = ({hideBetween = []}) => {
  const frame = useCurrentFrame();
  if (hideBetween.some(([a, b]) => frame >= a && frame < b)) return null;
  const c = (captions as {text: string; from: number; to: number}[]).find((x) => frame >= x.from && frame < x.to);
  if (!c) return null;
  const k = frame - c.from, o = interpolate(k, [0, 4], [0, 1], clamp) * interpolate(frame, [c.to - 5, c.to], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 82, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{font: `600 38px ${SANS}`, color: '#fff', padding: '10px 26px', borderRadius: 12, background: 'rgba(4,6,14,0.55)',
        backdropFilter: 'blur(6px)', textShadow: '0 2px 12px rgba(0,0,0,0.8)', transform: `translateY(${(1 - o) * 10}px)`, maxWidth: 1400, textAlign: 'center'}}>
        {c.text}
      </div>
    </div>
  );
};

/** Mira's comm feed: her face cropped from a lip-synced clip, in a glowing ring, with a live voice meter. */
export const CommFeed: React.FC<{src: string; startFrom?: number; x?: number; y?: number; size?: number; levels?: number[]; levelOffset?: number}> = ({
  src, startFrom = 0, x = 96, y = 690, size = 250, levels = [], levelOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 16}});
  const lvl = levels[frame - levelOffset] ?? 0;
  // her face sits around (960, 262) in the 1920x1080 clip: centre it in the circle
  const scale = 0.95, fx = 960, fy = 262;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: size + 330, height: size, transform: `scale(${0.7 + 0.3 * s})`, transformOrigin: 'left center', opacity: s}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        boxShadow: `0 0 0 3px ${C.cyan}, 0 0 ${30 + lvl * 40}px ${C.cyan}aa`, background: '#000'}}>
        <div style={{position: 'absolute', width: 1920 * scale, height: 1080 * scale, left: size / 2 - fx * scale, top: size / 2 - fy * scale}}>
          <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted style={{width: '100%', height: '100%'}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: size + 28, top: size / 2 - 52}}>
        <div style={{font: `700 26px ${DISPLAY}`, color: C.text, letterSpacing: '0.08em'}}>MIRA</div>
        <div style={{font: `500 14px ${MONO}`, color: C.cyan, letterSpacing: '0.2em', marginTop: 4}}>● LIVE · VOICE LINK</div>
        <div style={{display: 'flex', gap: 5, alignItems: 'center', height: 40, marginTop: 10}}>
          {Array.from({length: 18}, (_, i) => {
            const v = levels[frame - levelOffset - Math.abs(i - 9)] ?? 0;
            return <div key={i} style={{width: 6, height: 6 + v * 34 * (1 - Math.abs(i - 9) / 12), borderRadius: 3, background: C.cyan, opacity: 0.5 + v * 0.5}} />;
          })}
        </div>
      </div>
    </div>
  );
};

/** Text that types itself out from `at`, `cps` characters a second, with a block cursor. */
export const Typed: React.FC<{text: string; at?: number; cps?: number; style?: React.CSSProperties; cursor?: boolean}> = ({text, at = 0, cps = 40, style, cursor = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = Math.max(0, Math.floor(((frame - at) / fps) * cps));
  const done = n >= text.length;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {cursor && frame >= at && (!done || Math.floor(frame / 15) % 2 === 0) ? <span style={{opacity: 0.9}}>▌</span> : null}
    </span>
  );
};

export const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
