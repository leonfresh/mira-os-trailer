// "Mira Explains #1: AI agents", a YouTube Short (1080x1920) in the Mira OS trailer's style: Mira on the bridge
// (a lip-synced portrait capture) on top, the idea drawn as HUD graphics below her, word-by-word captions,
// glitch cuts and flashes on the beats. Line times come from public/short-agents/timeline.json (short_capture.py).
// Keep text out of the bottom 380 px and the right 140 px: the Shorts player covers them.
import React from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, TEAM} from './timeline';
import {DISPLAY, MONO, SANS} from './fonts';
import {clamp, Flash, GlitchCut, Grain, Scanlines, Typed, Vignette} from './fx';
import TL from '../public/short-agents/timeline.json';

const FPS = 30;
const L = TL.lines as Record<string, {at: number; seconds: number; text: string}>;
const at = (id: string, plus = 0) => Math.round((L[id].at + plus) * FPS);
const end = (id: string) => Math.round((L[id].at + L[id].seconds) * FPS);
export const SHORT_LENGTH = Math.round(TL.length * FPS);

// ---------------------------------------------------------------- word-by-word captions
type Word = {w: string; from: number; to: number};
const WORDS: Word[] = Object.values(L).flatMap((l) => {
  const words = l.text.split(/\s+/), total = words.reduce((a, w) => a + w.length + 1, 0);
  let t = l.at;
  return words.map((w) => { const d = ((w.length + 1) / total) * l.seconds; const r = {w, from: t, to: t + d}; t += d; return r; });
});
const Captions: React.FC = () => {
  const frame = useCurrentFrame(), t = frame / FPS;
  const i = WORDS.findIndex((w) => t >= w.from && t < w.to + 0.25);
  if (i < 0) return null;
  // show the current word with up to two neighbours, in chunks of three, the spoken one lit
  const chunk = Math.floor(i / 3) * 3, group = WORDS.slice(chunk, chunk + 3).filter((w) => w.from - WORDS[chunk].from < 2.5);
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1010, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 18px'}}>
      {group.map((w, k) => {
        const on = chunk + k === i, s = interpolate(t - w.from, [0, 0.12], [0.85, 1], clamp);
        return <span key={k} style={{font: `900 74px ${DISPLAY}`, textTransform: 'uppercase', color: on ? C.cyan : '#fff', transform: `scale(${on ? s * 1.06 : 1})`,
          textShadow: on ? `0 0 28px ${C.cyan}, 0 4px 0 #000` : '0 4px 0 #000, 0 0 20px rgba(0,0,0,0.9)', WebkitTextStroke: '2px #000', display: 'inline-block'}}>{w.w}</span>;
      })}
    </div>
  );
};

// ---------------------------------------------------------------- pieces
const Panel: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = C.cyan, style}) => (
  <div style={{background: 'rgba(4,8,18,0.78)', border: `2px solid ${color}`, borderRadius: 18, boxShadow: `0 0 30px ${color}55, inset 0 0 40px ${color}18`, padding: 26, ...style}}>{children}</div>
);
const pop = (frame: number, fps: number, from: number) => spring({frame: frame - from, fps, config: {damping: 13, stiffness: 160}});

const Tag: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 60, top: 70, display: 'flex', alignItems: 'center', gap: 16}}>
      <div style={{width: 14, height: 14, borderRadius: 7, background: C.pink, opacity: Math.floor(frame / 15) % 2 ? 1 : 0.3, boxShadow: `0 0 12px ${C.pink}`}} />
      <div style={{font: `700 30px ${MONO}`, color: C.text, letterSpacing: '0.2em'}}>MIRA EXPLAINS</div>
      <div style={{font: `700 26px ${MONO}`, color: C.cyan, letterSpacing: '0.2em', border: `2px solid ${C.cyan}`, padding: '2px 10px', borderRadius: 6}}>#01</div>
    </div>
  );
};

// 0:00 the hook: a boot terminal, a glitch, her, the title slams in
const BOOT = ['> spawn agent --name mira', '[ ok ] tools: read · run · search', '[ ok ] loop: plan → act → check', '> explain "AI agents"'];
const Hook: React.FC = () => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig();
  const s = pop(frame, fps, 10), out = interpolate(frame, [at('act') - 6, at('act')], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', left: 60, right: 140, top: 1230, transform: `scale(${1.4 - 0.4 * s})`, opacity: Math.min(1, s * 1.4), transformOrigin: 'left center'}}>
        <div style={{font: `900 112px ${DISPLAY}`, color: C.text, lineHeight: 1, textShadow: `0 0 40px ${C.cyan}`}}>AI AGENTS</div>
        <div style={{font: `700 40px ${MONO}`, color: C.cyan, letterSpacing: '0.16em', marginTop: 14}}>EXPLAINED BY ONE</div>
      </div>
    </AbsoluteFill>
  );
};
const BootScreen: React.FC = () => (
  <AbsoluteFill style={{background: C.bg, padding: '700px 60px 0'}}>
    {BOOT.map((line, i) => <div key={i} style={{font: `500 40px ${MONO}`, color: i % 3 === 0 ? C.cyan : 'rgba(210,230,255,0.7)', marginBottom: 18}}>
      <Typed text={line} at={i * 3} cps={160} cursor={i === BOOT.length - 1} /></div>)}
  </AbsoluteFill>
);

// "A chatbot answers. An agent acts."
const Versus: React.FC = () => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), f0 = at('act');
  const a = pop(frame, fps, f0 + 2), b = pop(frame, fps, f0 + Math.round(1.7 * FPS));
  const dimA = interpolate(frame, [f0 + 60, f0 + 70], [1, 0.35], clamp);
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1210, display: 'flex', gap: 24}}>
      <Panel color={C.violet} style={{flex: 1, opacity: a * dimA, transform: `translateY(${(1 - a) * 40}px)`}}>
        <div style={{font: `900 40px ${DISPLAY}`, color: C.violet}}>CHATBOT</div>
        <div style={{font: `500 30px ${SANS}`, color: C.text, marginTop: 14, background: 'rgba(143,123,255,0.18)', borderRadius: 14, padding: '12px 16px'}}>“Here's how you could fix it…”</div>
        <div style={{font: `700 26px ${MONO}`, color: C.dim, marginTop: 14}}>ANSWERS</div>
      </Panel>
      <Panel color={C.green} style={{flex: 1, opacity: b, transform: `translateY(${(1 - b) * 40}px) scale(${1 + 0.04 * b})`}}>
        <div style={{font: `900 40px ${DISPLAY}`, color: C.green}}>AGENT</div>
        {['✓ opened the file', '✓ fixed the bug', '✓ ran the tests'].map((t, i) => (
          <div key={i} style={{font: `600 28px ${MONO}`, color: C.text, marginTop: 10, opacity: interpolate(frame, [f0 + 58 + i * 6, f0 + 62 + i * 6], [0, 1], clamp)}}>{t}</div>))}
        <div style={{font: `700 26px ${MONO}`, color: C.green, marginTop: 14}}>ACTS</div>
      </Panel>
    </div>
  );
};

// "You give me a goal. I break it into steps, then I use tools..."
const TOOLS = [
  {k: 'READ', c: C.cyan, line: '$ cat src/game/warden.ts', w: 'read'},
  {k: 'RUN', c: C.orange, line: '$ npm test   ✓ 17 passed', w: 'run'},
  {k: 'SEARCH', c: C.pink, line: '🔍 "how does MCP work"', w: 'search'},
];
const Tools: React.FC = () => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), f0 = at('tools');
  const wordAt = (w: string) => { const x = WORDS.find((q) => q.from >= L.tools.at && q.w.toLowerCase().startsWith(w)); return Math.round((x?.from ?? 0) * FPS); };
  const g = pop(frame, fps, f0 + 2), steps = pop(frame, fps, wordAt('break'));
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1190}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: g, transform: `scale(${0.8 + 0.2 * g})`, transformOrigin: 'left'}}>
        <div style={{font: `900 34px ${DISPLAY}`, color: '#000', background: C.cyan, padding: '8px 18px', borderRadius: 10}}>GOAL</div>
        <div style={{font: `600 32px ${SANS}`, color: C.text}}>“fix the login bug”</div>
      </div>
      <div style={{display: 'flex', gap: 12, marginTop: 18, opacity: steps}}>
        {[1, 2, 3].map((n) => <div key={n} style={{font: `700 26px ${MONO}`, color: C.cyan, border: `2px solid ${C.cyan}`, borderRadius: 8, padding: '6px 14px',
          transform: `translateX(${(1 - pop(frame, fps, wordAt('break') + n * 4)) * -30}px)`}}>STEP {n}</div>)}
      </div>
      {TOOLS.map((t) => {
        const s = pop(frame, fps, wordAt(t.w));
        return (
          <div key={t.k} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, opacity: s, transform: `translateX(${(1 - s) * 60}px)`}}>
            <div style={{width: 130, font: `900 28px ${DISPLAY}`, color: t.c, textAlign: 'right'}}>{t.k}</div>
            <div style={{flex: 1, font: `500 28px ${MONO}`, color: C.text, background: 'rgba(4,8,18,0.8)', border: `1.5px solid ${t.c}`, borderRadius: 10, padding: '10px 16px'}}>
              <Typed text={t.line} at={wordAt(t.w)} cps={50} cursor={false} /></div>
          </div>
        );
      })}
    </div>
  );
};

// "After every step, I check what happened, and decide what to do next. That loop is the whole trick."
const NODES = [{k: 'PLAN', c: C.cyan}, {k: 'ACT', c: C.orange}, {k: 'CHECK', c: C.pink}, {k: 'DECIDE', c: C.green}];
const Loop: React.FC = () => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), f0 = at('loop');
  const s = pop(frame, fps, f0), R = 210, cx = 470, cy = 270;
  const spin = Math.max(0, frame - f0) / FPS * 1.6, lit = Math.floor(spin) % 4;
  const trick = Math.round((L.loop.at + L.loop.seconds - 1.6) * FPS), big = pop(frame, fps, trick);
  return (
    <div style={{position: 'absolute', left: 0, top: 1150, width: 940, height: 560, opacity: s}}>
      <svg width={940} height={560} style={{position: 'absolute', overflow: 'visible'}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.cyan} strokeOpacity={0.35} strokeWidth={4} strokeDasharray="12 10" />
        <circle cx={cx + R * Math.cos(spin * Math.PI / 2 - Math.PI / 2)} cy={cy + R * Math.sin(spin * Math.PI / 2 - Math.PI / 2)} r={14} fill={C.text}
          style={{filter: `drop-shadow(0 0 14px ${C.cyan})`}} />
      </svg>
      {NODES.map((n, i) => {
        const a = i * Math.PI / 2 - Math.PI / 2, on = i === lit;
        return <div key={n.k} style={{position: 'absolute', left: cx + R * Math.cos(a) - 95, top: cy + R * Math.sin(a) - 32, width: 190, textAlign: 'center',
          font: `900 34px ${DISPLAY}`, color: on ? '#000' : n.c, background: on ? n.c : 'rgba(4,8,18,0.85)', border: `2px solid ${n.c}`, borderRadius: 12, padding: '10px 0',
          boxShadow: on ? `0 0 34px ${n.c}` : 'none', transform: `scale(${(on ? 1.08 : 1) * (0.6 + 0.4 * pop(frame, fps, f0 + i * 5))})`}}>{n.k}</div>;
      })}
      <div style={{position: 'absolute', left: cx - 160, top: cy - 44, width: 320, textAlign: 'center', transform: `scale(${0.7 + 0.5 * big})`, opacity: 0.5 + 0.5 * big}}>
        <div style={{font: `900 46px ${DISPLAY}`, color: C.text, textShadow: `0 0 30px ${C.cyan}`}}>THE LOOP</div>
      </div>
    </div>
  );
};

// "Big job? I spin up a team. A lead plans, a coder builds, a researcher digs."
const Team: React.FC = () => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), f0 = at('team');
  const crew = TEAM.filter((t) => ['lead', 'coder', 'researcher'].includes(t.name));
  const when = (w: string) => { const x = WORDS.find((q) => q.from >= L.team.at && q.w.toLowerCase().startsWith(w)); return Math.round((x?.from ?? 0) * FPS); };
  const hub = pop(frame, fps, f0 + 3);
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1180}}>
      <div style={{font: `900 40px ${DISPLAY}`, color: C.green, opacity: hub, textShadow: `0 0 20px ${C.green}`}}>MIRA <span style={{color: C.dim, font: `600 28px ${MONO}`}}>→ spawns</span></div>
      {crew.map((t) => {
        const s = pop(frame, fps, when(t.name));
        return (
          <div key={t.name} style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 18, opacity: s, transform: `translateX(${(1 - s) * 80}px)`}}>
            <div style={{width: 6, height: 66, background: t.color, borderRadius: 3, boxShadow: `0 0 14px ${t.color}`}} />
            <Panel color={t.color} style={{flex: 1, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{font: `900 38px ${DISPLAY}`, color: t.color}}>{t.name.toUpperCase()}</span>
              <span style={{font: `500 24px ${MONO}`, color: C.text}}>{t.role}</span>
            </Panel>
          </div>
        );
      })}
    </div>
  );
};

// "And anything risky waits for a human. Always."
const Guard: React.FC = () => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), f0 = at('guard');
  const s = pop(frame, fps, f0 + 2), stamp = pop(frame, fps, at('guard', 2.55));
  const pulse = 0.6 + 0.4 * Math.sin(frame * 0.3);
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1200, opacity: s, transform: `scale(${0.85 + 0.15 * s})`}}>
      <Panel color={C.orange}>
        <div style={{font: `700 26px ${MONO}`, color: C.orange, letterSpacing: '0.16em'}}>⚠ RISKY CHANGE</div>
        <div style={{font: `600 34px ${SANS}`, color: C.text, marginTop: 10}}>delete 4,000 old user records</div>
        <div style={{display: 'flex', gap: 16, marginTop: 20, alignItems: 'center'}}>
          <div style={{font: `900 28px ${DISPLAY}`, color: '#000', background: C.green, padding: '10px 22px', borderRadius: 10, boxShadow: `0 0 ${20 * pulse}px ${C.green}`}}>APPROVE</div>
          <div style={{font: `900 28px ${DISPLAY}`, color: C.text, border: `2px solid ${C.red}`, padding: '8px 22px', borderRadius: 10}}>DENY</div>
          <div style={{font: `600 24px ${MONO}`, color: C.dim}}>waiting for a human…</div>
        </div>
      </Panel>
      <div style={{position: 'absolute', right: 10, top: -40, font: `900 64px ${DISPLAY}`, color: C.red, border: `5px solid ${C.red}`, padding: '4px 20px', borderRadius: 10,
        transform: `rotate(-10deg) scale(${2.2 - 1.2 * stamp})`, opacity: stamp, textShadow: `0 0 20px ${C.red}`}}>ALWAYS</div>
    </div>
  );
};

// the outro and end card
const Outro: React.FC = () => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), f0 = at('outro');
  const s = pop(frame, fps, f0 + 4), next = pop(frame, fps, end('outro') + 4);
  return (
    <div style={{position: 'absolute', left: 60, right: 140, top: 1210, opacity: s}}>
      <div style={{font: `900 96px ${DISPLAY}`, color: C.text, lineHeight: 1, textShadow: `0 0 40px ${C.cyan}`, transform: `scale(${1.3 - 0.3 * s})`, transformOrigin: 'left'}}>MIRA<br />EXPLAINS</div>
      <div style={{marginTop: 26, opacity: next, transform: `translateY(${(1 - next) * 30}px)`, display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{font: `700 26px ${MONO}`, color: '#000', background: C.pink, padding: '6px 14px', borderRadius: 8}}>NEXT</div>
        <div style={{font: `700 36px ${SANS}`, color: C.text}}>what is MCP?</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- the Short
export const ShortAgents: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = 10;                                            // the boot screen glitch-cuts to her at 10 frames
  const beats = ['act', 'tools', 'loop', 'team', 'guard', 'outro'].map((id) => at(id));
  const push = 1.08 + 0.05 * Math.sin(frame / 90);           // a slow breathing push on her
  const shift = beats.filter((b) => frame >= b).length % 2 ? -18 : 18;   // the frame nudges on each beat
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <GlitchCut at={cut} len={8}>
        <AbsoluteFill style={{transform: `scale(${push}) translateX(${shift}px)`, transformOrigin: '50% 30%'}}>
          <OffthreadVideo src={staticFile('short-agents/footage/mira.mp4')} muted />
        </AbsoluteFill>
      </GlitchCut>
      {/* a dark floor under the graphics so they read over her */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 42%, rgba(2,4,10,0.55) 55%, rgba(2,4,10,0.92) 66%, rgba(2,4,10,0.96) 100%)'}} />
      <Sequence durationInFrames={cut + 2}><BootScreen /></Sequence>
      <Sequence from={0} durationInFrames={at('act') + 2}><Hook /></Sequence>
      <Sequence from={0} durationInFrames={at('tools')}><Versus /></Sequence>
      <Sequence from={0} durationInFrames={at('loop')}><Tools /></Sequence>
      <Sequence from={0} durationInFrames={at('team')}><Loop /></Sequence>
      <Sequence from={0} durationInFrames={at('guard')}><Team /></Sequence>
      <Sequence from={0} durationInFrames={at('outro')}><Guard /></Sequence>
      <Sequence from={0}><Outro /></Sequence>
      <Captions />
      <Tag />
      {/* HUD corners sized for portrait */}
      <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.75}}>
        {[[40, 40, 'Left', 'Top'], [40, 40, 'Right', 'Top'], [40, 40, 'Left', 'Bottom'], [40, 40, 'Right', 'Bottom']].map(([x, y, h, v], i) => (
          <div key={i} style={{position: 'absolute', [String(h).toLowerCase()]: x, [String(v).toLowerCase()]: y, width: 54, height: 54,
            [`border${h}`]: `3px solid ${C.cyan}`, [`border${v}`]: `3px solid ${C.cyan}`}} />))}
      </AbsoluteFill>
      {beats.map((b, i) => <Flash key={i} at={b} len={7} color={i % 2 ? C.cyan : '#fff'} peak={0.35} />)}
      <Flash at={cut} len={10} color={C.cyan} peak={0.7} />
      <Flash at={at('guard', 2.55)} len={8} color={C.red} peak={0.4} />
      <Scanlines opacity={0.06} />
      <Vignette strength={0.55} />
      <Grain opacity={0.06} />
      <Audio src={staticFile('short-agents/audio/mix.wav')} />
    </AbsoluteFill>
  );
};
