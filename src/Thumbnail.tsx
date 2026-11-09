// YouTube thumbnail, 1280x720: Mira's double peace on the bridge (look 5), a bold two-line hook, the badge.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C} from './timeline';
import {DISPLAY, MONO} from './fonts';

export const Thumbnail: React.FC<{top: string; bottom: string; badge: string}> = ({top, bottom, badge}) => (
  <AbsoluteFill style={{background: C.bg}}>
    {/* her: the double peace frame, pushed right and in */}
    <AbsoluteFill style={{transform: 'translate(300px, 60px) scale(1.12)', transformOrigin: '50% 0%'}}>
      <Img src={staticFile('thumb/mira.png')} style={{width: 1280, height: 720}} />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(3,4,12,0.97) 0%, rgba(3,4,12,0.9) 36%, rgba(3,4,12,0.2) 60%, transparent 75%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 72% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)'}} />
    {/* the hook */}
    <div style={{position: 'absolute', left: 58, top: 150}}>
      <div style={{font: `900 92px ${DISPLAY}`, color: '#fff', lineHeight: 1, letterSpacing: '0.01em', textShadow: `0 0 30px ${C.cyan}99, 0 6px 0 #000`}}>{top}</div>
      <div style={{font: `900 104px ${DISPLAY}`, color: C.pink, lineHeight: 1.02, letterSpacing: '0.01em', marginTop: 10,
        textShadow: `0 0 36px ${C.pink}cc, 0 7px 0 #000`, WebkitTextStroke: '2px #fff3'}}>{bottom}</div>
      <div style={{display: 'inline-block', marginTop: 30, font: `800 34px ${MONO}`, color: '#021014', background: C.cyan, padding: '10px 20px', borderRadius: 8,
        boxShadow: `0 0 30px ${C.cyan}`, transform: 'rotate(-2deg)'}}>{badge}</div>
    </div>
    {/* brand */}
    <div style={{position: 'absolute', left: 58, top: 50, display: 'flex', alignItems: 'center', gap: 14}}>
      <svg width={44} height={44} viewBox="0 0 100 100" style={{filter: `drop-shadow(0 0 10px ${C.cyan})`}}>
        <polygon points="88,72 50,94 12,72 12,28 50,6 88,28" fill="none" stroke={C.cyan} strokeWidth={7} />
        <circle cx={50} cy={50} r={12} fill={C.pink} />
      </svg>
      <div style={{font: `900 34px ${DISPLAY}`, color: C.text, letterSpacing: '0.12em'}}>MIRA OS</div>
      <div style={{font: `700 18px ${MONO}`, color: C.pink, border: `2px solid ${C.pink}`, padding: '3px 10px', borderRadius: 4, marginLeft: 6}}>DEV LOG 01</div>
    </div>
    {/* a thin frame so it pops in the grid */}
    <AbsoluteFill style={{boxShadow: `inset 0 0 0 5px ${C.cyan}55`}} />
  </AbsoluteFill>
);
