// The trailer's sections. Frames inside each scene are relative to its <Sequence>.
import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig, Sequence} from 'remotion';
import {C, f, TEAM, VO, T, CLIP_LEAD} from './timeline';
import {DISPLAY, MONO, SANS} from './fonts';
import {Callout, clamp, CommFeed, ease, Flash, GlitchCut, HudCorners, SectionTag, Typed} from './fx';
import vo from '../public/audio/vo.json';
import captions from './captions.json';

const LV = vo as unknown as Record<string, {levels: number[]}>;
const video = (name: string) => staticFile(`footage/${name}.mp4`);

// ---------------------------------------------------------------- shared bits
const Logo: React.FC<{size?: number; draw?: number}> = ({size = 120, draw = 1}) => {
  const pts = Array.from({length: 6}, (_, i) => {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    return `${50 + 44 * Math.cos(a)},${50 + 44 * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{filter: `drop-shadow(0 0 18px ${C.cyan})`}}>
      <polygon points={pts} fill="none" stroke={C.cyan} strokeWidth={5} strokeDasharray={300} strokeDashoffset={300 * (1 - draw)} />
      <polygon points={pts} fill={C.cyan} opacity={0.18 * draw} transform="translate(50 50) scale(0.62) translate(-50 -50)" />
      <circle cx={50} cy={50} r={9 * draw} fill={C.pink} style={{filter: `drop-shadow(0 0 10px ${C.pink})`}} />
    </svg>
  );
};

const Wordmark: React.FC<{frame: number; big?: boolean}> = ({frame, big}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 13, stiffness: 120}});
  const track = interpolate(frame, [0, 40], [0.5, 0.14], {...clamp, easing: ease});
  const sweep = interpolate(frame, [18, 48], [-30, 130], clamp);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: big ? 44 : 34, transform: `scale(${1.5 - 0.5 * s})`, opacity: Math.min(1, s * 1.4)}}>
      <Logo size={big ? 170 : 140} draw={interpolate(frame, [0, 22], [0, 1], clamp)} />
      <div style={{position: 'relative'}}>
        <div style={{font: `900 ${big ? 190 : 160}px ${DISPLAY}`, letterSpacing: `${track}em`, color: C.text, lineHeight: 1,
          textShadow: `0 0 40px ${C.cyan}88, 0 0 90px ${C.cyan}44`,
          WebkitMaskImage: `linear-gradient(100deg, #000 ${sweep - 20}%, #fff ${sweep}%, #000 ${sweep + 20}%)`}}>MIRA OS</div>
        <div style={{position: 'absolute', inset: 0, font: `900 ${big ? 190 : 160}px ${DISPLAY}`, letterSpacing: `${track}em`, lineHeight: 1,
          background: `linear-gradient(100deg, transparent ${sweep - 12}%, rgba(255,255,255,0.95) ${sweep}%, transparent ${sweep + 12}%)`,
          WebkitBackgroundClip: 'text', color: 'transparent'}}>MIRA OS</div>
      </div>
    </div>
  );
};

const Letterbox: React.FC<{amount?: number}> = ({amount = 1}) => (
  <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 96 * amount, background: '#000'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 * amount, background: '#000'}} />
  </>
);

// ---------------------------------------------------------------- 0:00 boot
const BOOT_LINES = [
  ['MIRA OS  v0.2  ·  cold boot', C.pink],
  ['[ ok ]  memory map ............ 190 files', C.dim],
  ['[ ok ]  routines .............. online', C.dim],
  ['[ ok ]  agent team ............ lead · coder · researcher · marketer', C.dim],
  ['[ ok ]  voice ................. mimo / chloe', C.dim],
  ['[ ok ]  guardrails ............ armed', C.green],
  ['> wake mira', C.cyan],
] as const;

export const Boot: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = f(VO.boot - CLIP_LEAD.boot);            // 2.0 s: she appears
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {frame < cut + 4 ? (
        <AbsoluteFill style={{padding: '300px 0 0 330px', opacity: interpolate(frame, [cut - 4, cut + 2], [1, 0], clamp)}}>
          {BOOT_LINES.map(([text, color], i) => (
            <div key={i} style={{font: `500 30px ${MONO}`, color, marginBottom: 14, textShadow: `0 0 12px ${color}66`}}>
              <Typed text={text} at={i * 8} cps={140} cursor={i === BOOT_LINES.length - 1} />
            </div>
          ))}
        </AbsoluteFill>
      ) : null}
      <Sequence from={cut}>
        <GlitchCut at={0} len={8}>
          <AbsoluteFill>
            <OffthreadVideo src={video('boot')} muted />
          </AbsoluteFill>
        </GlitchCut>
        <HudCorners label="MIRA · ONLINE" />
        <Flash at={0} len={10} color={C.cyan} peak={0.6} />
      </Sequence>
      <Letterbox amount={interpolate(frame, [cut, cut + 20], [0, 1], clamp)} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 0:06 logo
export const LogoSlam: React.FC = () => {
  const frame = useCurrentFrame();
  const ring = interpolate(frame, [0, 26], [0, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{filter: `blur(${interpolate(frame, [0, 10], [0, 10], clamp)}px) brightness(0.42) saturate(1.2)`, transform: `scale(${1.05 + frame * 0.0006})`}}>
        <OffthreadVideo src={video('boot')} startFrom={f(T.logo - (VO.boot - CLIP_LEAD.boot))} muted />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{position: 'absolute', width: 1400 * ring, height: 1400 * ring, borderRadius: '50%', border: `${6 * (1 - ring) + 1}px solid ${C.cyan}`, opacity: 1 - ring}} />
        <Wordmark frame={frame} />
        <div style={{marginTop: 34, font: `500 30px ${MONO}`, color: C.cyan, letterSpacing: '0.24em', textTransform: 'uppercase'}}>
          <Typed text="an AI operating system with a face" at={16} cps={34} cursor={false} />
        </div>
        <div style={{marginTop: 26, font: `700 18px ${MONO}`, color: C.pink, letterSpacing: '0.4em', opacity: interpolate(frame, [60, 72], [0, 1], clamp),
          border: `1.5px solid ${C.pink}`, padding: '8px 18px', borderRadius: 4}}>DEV LOG 01</div>
      </AbsoluteFill>
      <Flash at={0} len={14} peak={1} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 0:10 the map
export const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const clip = (name: string, from: number, len: number, startFrom = 0) => (
    <Sequence from={f(from)} durationInFrames={f(len)}>
      <GlitchCut at={0} len={5}>
        <AbsoluteFill style={{transform: `scale(${1.02 + (frame - f(from)) * 0.0004})`}}>
          <OffthreadVideo src={video(name)} startFrom={startFrom} muted />
        </AbsoluteFill>
      </GlitchCut>
    </Sequence>
  );
  return (
    <AbsoluteFill style={{background: '#020308'}}>
      {clip('map-orbit', 0, 5.6)}
      {clip('map-rings', 5.6, 2.4, 15)}
      {clip('map-areas', 8.0, 2.0, 10)}
      <Sequence durationInFrames={f(5.6)}>
        <Callout at={f(1.2)} x={951} y={470} dx={260} dy={-150} big="190" small="files mapped" />
        <Callout at={f(2.4)} x={745} y={600} dx={-240} dy={120} big="8" small="areas of work" color={C.pink} />
        <Callout at={f(3.6)} x={1185} y={588} dx={260} dy={150} big="222" small="links between them" color={C.orange} />
        <Callout at={f(4.8)} x={640} y={330} dx={-220} dy={-110} big="15" small="routine runs" color={C.green} />
      </Sequence>
      <SectionTag n="01" title="THE MAP" />
      <Sequence from={f(VO.map - CLIP_LEAD.talk - T.map)}>
        <CommFeed src="footage/talk-map.mp4" levels={LV.map.levels} levelOffset={f(CLIP_LEAD.talk)} y={740} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 0:20 she does the work
const Chip: React.FC<{at: number; text: string; color: string}> = ({at, text, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 15}});
  if (frame < at) return null;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: s, transform: `translateX(${(1 - s) * 40}px)`, marginBottom: 14}}>
      <div style={{width: 14, height: 14, borderRadius: 3, background: color, boxShadow: `0 0 14px ${color}`}} />
      <div style={{font: `700 30px ${DISPLAY}`, color: C.text, letterSpacing: '0.04em'}}>{text}</div>
    </div>
  );
};

export const WorkScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inset = spring({frame: frame - f(1.1), fps, config: {damping: 16}});
  // the tablet's code sits around (700, 598) in the clip; show it again, 2.3x, in a holo frame on the right
  const Z = 2.3, cx = 700, cy = 598, W = 600, H = 380;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{transform: `scale(${1.0 + frame * 0.00022})`, transformOrigin: '45% 45%'}}>
        <OffthreadVideo src={video('work')} muted />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(90deg, transparent 50%, rgba(2,4,12,0.72) 72%)'}} />
      {frame >= f(1.1) ? (
        <div style={{position: 'absolute', left: 1268, top: 200, width: W, height: H, opacity: inset, transform: `perspective(1400px) rotateY(${(1 - inset) * -25 - 6}deg) scale(${0.85 + 0.15 * inset})`,
          border: `2px solid ${C.cyan}`, borderRadius: 14, overflow: 'hidden', boxShadow: `0 0 60px ${C.cyan}55, inset 0 0 40px ${C.cyan}22`, background: '#01060c'}}>
          <div style={{position: 'absolute', width: 1920 * Z, height: 1080 * Z, left: W / 2 - cx * Z, top: H / 2 - cy * Z, filter: 'brightness(1.35) contrast(1.1)'}}>
            <OffthreadVideo src={video('work')} muted style={{width: '100%', height: '100%'}} />
          </div>
          <div style={{position: 'absolute', left: 16, top: 12, font: `700 15px ${MONO}`, color: C.cyan, letterSpacing: '0.2em', background: 'rgba(0,0,0,0.55)', padding: '4px 10px', borderRadius: 4}}>
            LIVE TOOL FEED <span style={{opacity: Math.floor(frame / 12) % 2 ? 1 : 0.3}}>●</span>
          </div>
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 1290, top: 640}}>
        <Chip at={f(1.9)} text="reads your code" color={C.cyan} />
        <Chip at={f(2.8)} text="writes the change" color={C.violet} />
        <Chip at={f(5.1)} text="runs the commands" color={C.green} />
        <Chip at={f(6.4)} text="shows every step" color={C.pink} />
      </div>
      <SectionTag n="02" title="THE WORK" color={C.pink} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 0:30 the team
type CardPlan = {id: string; who: string; title: string; spawn?: number; doing: number; done: number; parent?: string};
const PLAN: CardPlan[] = [
  {id: 'p', who: 'lead', title: 'Launch the landing page', spawn: 0.4, doing: 0.4, done: 8.4},
  {id: 'a', who: 'coder', title: 'Build the hero section', spawn: 1.0, doing: 1.8, done: 6.2, parent: 'p'},
  {id: 'b', who: 'researcher', title: 'Scan 12 competitors', spawn: 2.2, doing: 3.0, done: 6.9, parent: 'p'},
  {id: 'c', who: 'marketer', title: 'Draft the launch thread', spawn: 3.4, doing: 4.2, done: 7.4, parent: 'p'},
  {id: 'd', who: 'coder', title: 'Wire up sign-ups', spawn: 4.6, doing: 5.3, done: 7.9, parent: 'p'},
];
const COLS = ['TO DO', 'DOING', 'DONE'];
const colOf = (c: CardPlan, t: number) => (t >= c.done ? 2 : t >= c.doing ? 1 : 0);

export const TeamScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const BX = 520, BY = 250, CW = 420, GAP = 26, CH = 118;
  const pos = (c: CardPlan) => {
    const col = colOf(c, t);
    const peers = PLAN.filter((x) => (x.spawn ?? 0) <= t && colOf(x, t) === col);
    const slot = peers.indexOf(c);
    return {x: BX + col * (CW + GAP) + 14, y: BY + 70 + slot * (CH + 14)};
  };
  const shown = PLAN.filter((c) => (c.spawn ?? 0) <= t);
  // cards glide between columns: ease each card's position toward its target over ~10 frames
  const glide = (c: CardPlan) => {
    const steps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => {
      const tt = Math.max(0, (frame - k) / fps);
      const col = colOf(c, tt);
      const peers = PLAN.filter((x) => (x.spawn ?? 0) <= tt && colOf(x, tt) === col);
      return {x: BX + col * (CW + GAP) + 14, y: BY + 70 + Math.max(0, peers.indexOf(c)) * (CH + 14)};
    });
    return {x: steps.reduce((a, s) => a + s.x, 0) / steps.length, y: steps.reduce((a, s) => a + s.y, 0) / steps.length};
  };
  const lead = PLAN[0], lp = glide(lead);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{filter: 'blur(16px) brightness(0.32) saturate(1.3)', transform: 'scale(1.1)'}}>
        <OffthreadVideo src={video('talk-team')} muted />
      </AbsoluteFill>
      {/* roster */}
      <div style={{position: 'absolute', left: BX, top: 158, display: 'flex', gap: 16}}>
        {TEAM.map((p, i) => {
          const s = spring({frame: frame - 6 - i * 3, fps, config: {damping: 14}});
          const busy = PLAN.some((c) => c.who === p.name && colOf(c, t) === 1 && (c.spawn ?? 0) <= t);
          return (
            <div key={p.name} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 8px', borderRadius: 40, opacity: s,
              border: `1.5px solid ${p.color}${busy ? 'ff' : '55'}`, background: `${p.color}18`, boxShadow: busy ? `0 0 20px ${p.color}66` : 'none'}}>
              <div style={{width: 34, height: 34, borderRadius: '50%', background: p.color, display: 'grid', placeItems: 'center', font: `800 18px ${SANS}`, color: '#0a0a12'}}>{p.name[0].toUpperCase()}</div>
              <div style={{font: `600 20px ${MONO}`, color: C.text}}>@{p.name}</div>
              {busy ? <div style={{font: `500 13px ${MONO}`, color: p.color, opacity: Math.floor(frame / 10) % 2 ? 1 : 0.4}}>● working</div> : null}
            </div>
          );
        })}
      </div>
      {/* columns */}
      {COLS.map((name, i) => (
        <div key={name} style={{position: 'absolute', left: BX + i * (CW + GAP), top: BY, width: CW, height: 660, borderRadius: 16,
          border: '1px solid rgba(160,190,255,0.16)', background: 'rgba(10,14,28,0.72)', backdropFilter: 'blur(4px)'}}>
          <div style={{padding: '18px 20px', font: `700 20px ${MONO}`, color: i === 2 ? C.green : C.dim, letterSpacing: '0.2em', display: 'flex', justifyContent: 'space-between'}}>
            <span>{name}</span><span>{shown.filter((c) => colOf(c, t) === i).length}</span>
          </div>
        </div>
      ))}
      {/* the lines from the lead's card to the cards it spawned */}
      <svg style={{position: 'absolute', inset: 0}} width={1920} height={1080}>
        {shown.filter((c) => c.parent).map((c) => {
          const p = glide(c), k = interpolate(t, [c.spawn!, c.spawn! + 0.35], [0, 1], clamp);
          const x1 = lp.x + CW - 30, y1 = lp.y + CH / 2, x2 = p.x, y2 = p.y + CH / 2;
          const col = TEAM.find((m) => m.name === c.who)!.color;
          return <path key={c.id} d={`M${x1},${y1} C${x1 + 120},${y1} ${x2 - 120},${y2} ${x2},${y2}`} fill="none" stroke={col} strokeWidth={2.5}
            strokeDasharray="8 7" strokeDashoffset={-frame * 1.2} opacity={0.75 * k * (colOf(c, t) === 2 ? 0.35 : 1)} pathLength={1} style={{}} />;
        })}
      </svg>
      {shown.map((c) => {
        const p = glide(c), m = TEAM.find((x) => x.name === c.who)!;
        const s = spring({frame: frame - f(c.spawn ?? 0), fps, config: {damping: 13, stiffness: 150}});
        const col = colOf(c, t), kids = PLAN.filter((x) => x.parent === c.id && (x.spawn ?? 0) <= t);
        return (
          <div key={c.id} style={{position: 'absolute', left: p.x, top: p.y, width: CW - 28, height: CH, borderRadius: 12, padding: '12px 16px',
            background: 'rgba(16,22,40,0.95)', border: `1px solid ${m.color}55`, borderLeft: `4px solid ${m.color}`, transform: `scale(${0.6 + 0.4 * s})`, opacity: s,
            boxShadow: col === 1 ? `0 0 26px ${m.color}55` : '0 8px 20px rgba(0,0,0,0.35)', boxSizing: 'border-box'}}>
            {c.parent ? <div style={{font: `500 14px ${MONO}`, color: C.dim}}><span style={{color: m.color}}>↳</span> from “Launch the landing page”</div> : null}
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: c.parent ? 4 : 0}}>
              <div style={{font: `600 16px ${MONO}`, color: m.color}}>@{c.who}</div>
              <div style={{marginLeft: 'auto', font: `500 14px ${MONO}`, color: col === 2 ? C.green : m.color, opacity: col === 1 && Math.floor(frame / 10) % 2 ? 0.45 : 1}}>
                {col === 2 ? '✓ done' : col === 1 ? (c.id === 'p' && t > 4.9 ? `waiting on ${PLAN.filter((x) => x.parent === 'p' && colOf(x, t) < 2).length}` : '● running') : 'queued'}
              </div>
            </div>
            <div style={{font: `600 23px ${SANS}`, color: C.text, marginTop: 4}}>{c.title}</div>
            {kids.length ? (
              <div style={{display: 'flex', gap: 6, marginTop: 6}}>
                <span style={{font: `600 12px ${MONO}`, color: C.dim, letterSpacing: '0.1em'}}>SPAWNED {kids.length}</span>
                {kids.map((k) => { const km = TEAM.find((x) => x.name === k.who)!;
                  return <span key={k.id} style={{font: `500 12px ${MONO}`, color: C.text, padding: '0 8px', borderRadius: 10, border: `1px solid ${km.color}`, background: `${km.color}22`}}>{colOf(k, t) === 2 ? '✓' : '●'} @{k.who}</span>; })}
              </div>
            ) : null}
          </div>
        );
      })}
      {t > 8.6 ? (
        <div style={{position: 'absolute', left: BX + 2 * (CW + GAP) + 14, top: BY + 70 + 5 * (CH + 14) - 10, font: `600 18px ${MONO}`, color: C.green,
          opacity: interpolate(t, [8.6, 8.9], [0, 1], clamp)}}>↺ reported back to Leon</div>
      ) : null}
      <SectionTag n="03" title="THE TEAM" color={C.orange} />
      <Sequence from={f(VO.team - CLIP_LEAD.talk - T.team)}>
        <CommFeed src="footage/talk-team.mp4" levels={LV.team.levels} levelOffset={f(CLIP_LEAD.talk)} x={70} y={770} size={200} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 0:40 guardrails
// Small fixes land on their own (auto-apply); anything critical waits for Leon; everything can be undone.
const DIFF = [
  ['-', 'const charge = await stripe.charges.create(req);'],
  ['+', 'const charge = await stripe.charges.create(req, {'],
  ['+', '  idempotencyKey: order.id,        // no double charge on retry'],
  ['+', '});'],
] as const;
const SMALL = [
  ['fixed a typo in README.md', 0.25],
  ['tidied the board styles', 0.65],
  ['renamed a helper in swarm.py', 1.05],
] as const;
// beats inside the scene (seconds): the critical card, its checks, approve, undo
export const GUARD_BEATS = {card: 2.4, checks: [2.9, 3.3, 3.7], approve: 4.4, undo: 6.8};   // on her words (src/captions.json)

export const GuardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const B = GUARD_BEATS;
  const panel = spring({frame: frame - f(B.card), fps, config: {damping: 16}});
  const approved = t >= B.approve, undone = t >= B.undo;
  // APPROVE sits at about (676, 636), UNDO at (1502, 636)
  const cx = t < B.approve + 0.9 ? interpolate(t, [B.approve - 0.8, B.approve - 0.1], [1500, 668], {...clamp, easing: ease})
    : interpolate(t, [B.undo - 0.8, B.undo - 0.1], [668, 1494], {...clamp, easing: ease});
  const cy = interpolate(t, [B.approve - 0.8, B.approve - 0.1], [930, 628], {...clamp, easing: ease});
  const checks = [['syntax checked', B.checks[0]], ['guardrails passed', B.checks[1]], ['backup saved', B.checks[2]]] as const;
  const state = undone ? C.orange : approved ? C.green : C.red;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{filter: 'blur(16px) brightness(0.3) saturate(1.3)', transform: 'scale(1.1)'}}>
        <OffthreadVideo src={video('talk-guard')} muted />
      </AbsoluteFill>
      {/* small fixes: straight in, no questions */}
      <div style={{position: 'absolute', left: 96, top: 262, width: 400}}>
        <div style={{font: `700 16px ${MONO}`, color: C.green, letterSpacing: '0.24em', marginBottom: 12, opacity: interpolate(t, [0.1, 0.4], [0, 1], clamp)}}>SMALL FIXES · AUTO-APPLIED</div>
        {SMALL.map(([label, at]) => {
          const s = spring({frame: frame - f(at), fps, config: {damping: 15}});
          return t >= at ? (
            <div key={label} style={{display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', marginBottom: 10, borderRadius: 10,
              background: 'rgba(61,220,151,0.09)', border: '1px solid rgba(61,220,151,0.35)', opacity: s * interpolate(t, [B.card, B.card + 0.6], [1, 0.45], clamp),
              transform: `translateX(${(1 - s) * -30}px)`}}>
              <span style={{font: `800 20px ${SANS}`, color: C.green}}>✓</span>
              <span style={{font: `500 19px ${MONO}`, color: C.text}}>{label}</span>
            </div>
          ) : null;
        })}
      </div>
      {/* the critical one waits for Leon */}
      {t >= B.card ? (
        <div style={{position: 'absolute', left: 560, top: 250, width: 1060, opacity: panel, transform: `translateY(${(1 - panel) * 40}px)`,
          borderRadius: 18, border: `1.5px solid ${state}`, background: 'rgba(10,14,28,0.92)',
          boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 ${approved ? 40 : 30 + 20 * Math.abs(Math.sin(t * 4))}px ${state}33`, padding: '26px 32px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{font: `700 17px ${MONO}`, letterSpacing: '0.2em', color: state}}>
              {undone ? '↺ UNDONE · RESTORED FROM BACKUP' : approved ? '✓ APPROVED BY LEON · APPLIED' : '⚠ CRITICAL · WAITING FOR LEON'}
            </div>
            <div style={{marginLeft: 'auto', font: `600 14px ${MONO}`, color: C.red, border: `1px solid ${C.red}88`, padding: '3px 10px', borderRadius: 20}}>touches billing</div>
            <div style={{font: `500 15px ${MONO}`, color: C.dim}}>lib/billing.ts</div>
          </div>
          <div style={{font: `700 34px ${SANS}`, color: C.text, marginTop: 12}}>Stop double-charging when a payment retries</div>
          <div style={{marginTop: 18, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(160,190,255,0.14)', opacity: undone ? 0.45 : 1}}>
            {DIFF.map(([m, line], i) => (
              <div key={i} style={{font: `500 22px ${MONO}`, padding: '6px 16px', whiteSpace: 'pre', color: m === '-' ? '#ffb3c0' : '#b9ffd9',
                background: m === '-' ? 'rgba(255,92,122,0.13)' : 'rgba(61,220,151,0.12)', textDecoration: undone && m === '+' ? 'line-through' : 'none'}}>
                <span style={{opacity: 0.7, marginRight: 14}}>{m}</span>{line}
              </div>
            ))}
          </div>
          <div style={{display: 'flex', gap: 22, marginTop: 20}}>
            {checks.map(([label, at]) => (
              <div key={label} style={{font: `600 19px ${MONO}`, color: t >= at ? C.green : 'rgba(210,230,255,0.25)'}}>{t >= at ? '✓' : '○'} {label}</div>
            ))}
          </div>
          <div style={{display: 'flex', gap: 14, marginTop: 24}}>
            <div style={{font: `800 22px ${SANS}`, padding: '14px 34px', borderRadius: 10, color: '#06110b', background: approved && !undone ? C.green : '#7cf0b8',
              boxShadow: t >= B.approve && t < B.approve + 0.4 ? `0 0 40px ${C.green}` : 'none', transform: `scale(${t >= B.approve && t < B.approve + 0.15 ? 0.94 : 1})`}}>{approved && !undone ? 'APPLIED' : 'APPROVE'}</div>
            <div style={{font: `800 22px ${SANS}`, padding: '14px 34px', borderRadius: 10, color: C.text, border: '1.5px solid rgba(210,230,255,0.3)'}}>REJECT</div>
            {approved ? (
              <div style={{marginLeft: 'auto', font: `800 22px ${SANS}`, padding: '14px 34px', borderRadius: 10, color: undone ? '#1a0e00' : C.orange,
                background: undone ? C.orange : 'transparent', border: `1.5px solid ${C.orange}`, boxShadow: t >= B.undo && t < B.undo + 0.4 ? `0 0 40px ${C.orange}` : 'none'}}>↺ UNDO</div>
            ) : null}
          </div>
        </div>
      ) : null}
      {t > B.approve - 0.9 && t < B.undo + 0.8 ? (
        <svg style={{position: 'absolute', left: cx, top: cy, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))'}} width={34} height={40} viewBox="0 0 34 40">
          <path d="M2 2 L2 32 L10 25 L16 38 L22 35 L16 22 L28 22 Z" fill="#fff" stroke="#000" strokeWidth={2} />
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: 560, top: 800, font: `700 26px ${DISPLAY}`, color: C.text, letterSpacing: '0.05em', opacity: interpolate(t, [B.undo + 0.4, B.undo + 0.9], [0, 1], clamp)}}>
        <span style={{color: C.green}}>small fixes: auto</span> · <span style={{color: C.red}}>critical: your call</span> · <span style={{color: C.orange}}>all: undoable</span>
      </div>
      <Flash at={f(B.approve)} len={8} color={C.green} peak={0.25} />
      <Flash at={f(B.undo)} len={8} color={C.orange} peak={0.25} />
      <SectionTag n="04" title="YOU STAY IN CONTROL" color={C.green} />
      <Sequence from={f(VO.guard - CLIP_LEAD.talk - T.guard)}>
        <CommFeed src="footage/talk-guard.mp4" levels={LV.guard.levels} levelOffset={f(CLIP_LEAD.talk)} x={70} y={770} size={200} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 0:48 stop-down: I talk. I listen. I even dress up.
export const StopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = (captions as {id: string; text: string; from: number; to: number}[]).filter((c) => c.id === 'fun');
  const base = f(T.stop);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Sequence from={f(VO.fun - CLIP_LEAD.talk - T.stop)}>
        <AbsoluteFill style={{transform: `scale(${1.08 + frame * 0.0016})`, transformOrigin: '50% 30%'}}>
          <OffthreadVideo src={video('talk-fun')} muted />
        </AbsoluteFill>
      </Sequence>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, transparent 30%, rgba(0,0,0,0.75) 90%)'}} />
      {words.map((w, i) => {
        const k = frame - (w.from - base);
        if (k < 0 || frame >= (words[i + 1] ? words[i + 1].from - base : f(4.5))) return null;
        const s = spring({frame: k, fps, config: {damping: 12, stiffness: 180}});
        const last = i === words.length - 1;
        return (
          <AbsoluteFill key={w.text} style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 150}}>
            <div style={{font: `900 ${last ? 120 : 132}px ${DISPLAY}`, color: C.text, letterSpacing: '0.04em', transform: `scale(${1.35 - 0.35 * s})`,
              textShadow: `0 0 40px ${last ? C.pink : C.cyan}, 0 6px 30px rgba(0,0,0,0.8)`, opacity: Math.min(1, s * 1.5)}}>{w.text.toUpperCase()}</div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 0:52 the drop: looks montage
const LOOKS = [
  ['CONCERT', 'PROJECTION SUIT'], ['NEBULA', 'LILAC FRILLS'], ['STARSHIP', 'EXPLORER'],
  ['CONCERT', 'COCKTAIL DRESS'], ['NEBULA', 'CAFÉ APRON'], ['STARSHIP', 'LOOK 05'],
];
export const Montage: React.FC = () => {
  const frame = useCurrentFrame();
  const i = Math.min(LOOKS.length - 1, Math.floor(frame / f(1)));
  const k = frame - i * f(1);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {LOOKS.map((_, n) => (
        <Sequence key={n} from={n * f(1)} durationInFrames={f(1)}>
          <GlitchCut at={0} len={4}>
            <AbsoluteFill style={{transform: `scale(${1.1 - Math.min(1, k / 8) * 0.06})`}}>
              <OffthreadVideo src={video(`look${n + 1}`)} startFrom={26} muted />
            </AbsoluteFill>
          </GlitchCut>
          <Flash at={0} len={5} peak={0.55} />
        </Sequence>
      ))}
      <div style={{position: 'absolute', left: 96, bottom: 120, transform: `translateX(${interpolate(k, [0, 6], [-30, 0], clamp)}px)`, opacity: interpolate(k, [0, 4], [0, 1], clamp)}}>
        <div style={{font: `700 20px ${MONO}`, color: C.pink, letterSpacing: '0.3em'}}>{LOOKS[i][0]}</div>
        <div style={{font: `900 64px ${DISPLAY}`, color: C.text, textShadow: `0 0 30px ${C.pink}88`}}>{LOOKS[i][1]}</div>
      </div>
      <div style={{position: 'absolute', right: 96, top: 92, textAlign: 'right'}}>
        <div style={{font: `700 18px ${MONO}`, color: C.cyan, letterSpacing: '0.28em'}}>12 OUTFITS · 7 STAGES · 5 PRESETS</div>
        <div style={{font: `500 16px ${MONO}`, color: C.dim, letterSpacing: '0.2em', marginTop: 6}}>{String(i + 1).padStart(2, '0')} / 06</div>
      </div>
      <HudCorners color={C.pink} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 0:58 outro
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{transform: `scale(${1.0 + frame * 0.0005})`}}>
        <OffthreadVideo src={video('outro')} muted />
      </AbsoluteFill>
      <Flash at={0} len={10} color={C.cyan} peak={0.5} />
      <HudCorners label="DEV LOG 01" />
      <Letterbox amount={interpolate(frame, [0, 20], [0, 1], clamp)} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 1:04.5 title
export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = interpolate(frame, [f(5.4), f(7.3)], [1, 0], clamp);
  const stars = Array.from({length: 140}, (_, i) => ({x: (i * 7919) % 1920, y: (i * 104729) % 1080, r: 0.6 + ((i * 31) % 10) / 6, tw: (i * 13) % 17}));
  const sub = spring({frame: frame - 26, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #0b1030 0%, ${C.bg} 65%)`, opacity: out}}>
      <svg style={{position: 'absolute', inset: 0}} width={1920} height={1080}>
        {stars.map((s, i) => <circle key={i} cx={(s.x + frame * (0.3 + s.r * 0.4)) % 1920} cy={s.y} r={s.r} fill="#cfe3ff" opacity={0.3 + 0.5 * Math.abs(Math.sin((frame + s.tw * 7) / 20))} />)}
      </svg>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Wordmark frame={frame} big />
        <div style={{marginTop: 40, font: `600 36px ${SANS}`, color: C.text, opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`}}>
          Your AI operating system — with a face, a voice and a team.
        </div>
        <div style={{display: 'flex', gap: 22, marginTop: 34, opacity: interpolate(frame, [48, 62], [0, 1], clamp)}}>
          <div style={{font: `700 20px ${MONO}`, color: C.pink, letterSpacing: '0.34em', border: `1.5px solid ${C.pink}`, padding: '10px 22px', borderRadius: 4}}>DEV LOG 01</div>
          <div style={{font: `700 20px ${MONO}`, color: C.cyan, letterSpacing: '0.34em', border: `1.5px solid ${C.cyan}`, padding: '10px 22px', borderRadius: 4}}>FOLLOW THE BUILD →</div>
        </div>
      </AbsoluteFill>
      <Flash at={0} len={16} peak={1} />
    </AbsoluteFill>
  );
};
