import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile} from 'remotion';
import {C} from './timeline';
import {DISPLAY, MONO} from './fonts';

/** Alternate trailer thumbnail built around the live workspace graph. */
export const ThumbnailMap: React.FC = () => (
  <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
    <AbsoluteFill style={{filter: 'brightness(0.92) saturate(1.18)'}}>
      <OffthreadVideo
        src={staticFile('footage/map-orbit.mp4')}
        startFrom={112}
        muted
        style={{width: 1280, height: 720, objectFit: 'cover'}}
      />
    </AbsoluteFill>

    <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(3,4,12,0.99) 0%, rgba(3,4,12,0.84) 24%, rgba(3,4,12,0.08) 65%, rgba(3,4,12,0.16) 100%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(3,4,12,0.35) 0%, transparent 55%)'}} />

    <div style={{position: 'absolute', left: 50, top: 40, padding: '9px 14px', border: `1px solid ${C.pink}99`,
      borderRadius: 6, background: 'rgba(3,8,16,0.8)', font: `700 15px ${MONO}`, color: C.pink,
      letterSpacing: '0.12em', boxShadow: `0 0 20px ${C.pink}22`}}>BUILT IN 2 DAYS</div>

    <div style={{position: 'absolute', right: 50, top: 38, display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 15px', border: `1px solid ${C.cyan}99`, borderRadius: 8, background: 'rgba(3,8,16,0.76)',
      boxShadow: `0 0 24px ${C.cyan}33`}}>
      <svg width={30} height={30} viewBox="0 0 100 100">
        <polygon points="88,72 50,94 12,72 12,28 50,6 88,28" fill="none" stroke={C.cyan} strokeWidth={8} />
        <circle cx={50} cy={50} r={12} fill={C.pink} />
      </svg>
      <span style={{font: `900 22px ${DISPLAY}`, color: C.text, letterSpacing: '0.1em'}}>MIRA OS</span>
      <span style={{font: `700 13px ${MONO}`, color: C.pink, borderLeft: `1px solid ${C.pink}88`, paddingLeft: 12}}>DEV LOG 01</span>
    </div>

    <div style={{position: 'absolute', left: 62, bottom: 58, width: 850}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16,
        font: `700 19px ${MONO}`, color: C.cyan, letterSpacing: '0.09em', textShadow: `0 0 14px ${C.cyan}66`}}>
        <span style={{width: 9, height: 9, borderRadius: '50%', background: C.pink, boxShadow: `0 0 13px ${C.pink}`}} />
        190 FILES&nbsp; · &nbsp;222 LINKS&nbsp; · &nbsp;15 RUNS
      </div>
      <div style={{font: `900 53px ${DISPLAY}`, color: C.text, lineHeight: 0.98, letterSpacing: '0.015em',
        textShadow: '0 4px 18px #000, 0 0 24px rgba(70,211,222,0.25)'}}>MY WHOLE WORKSPACE</div>
      <div style={{font: `900 79px ${DISPLAY}`, color: C.cyan, lineHeight: 1.04, letterSpacing: '0.005em', marginTop: 5,
        textShadow: `0 0 28px ${C.cyan}77, 0 5px 0 #000`}}>ONE LIVING MAP</div>
    </div>

    <div style={{position: 'absolute', right: 58, bottom: 78, width: 194, height: 194, borderRadius: '50%',
      overflow: 'hidden', border: `4px solid ${C.cyan}`, boxShadow: `0 0 26px ${C.cyan}99, 0 0 70px ${C.pink}44`,
      background: C.bg}}>
      <Img src={staticFile('thumb/mira-cameo.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </div>
    <div style={{position: 'absolute', right: 63, bottom: 45, font: `700 13px ${MONO}`, letterSpacing: '0.12em',
      color: C.text, textShadow: '0 2px 8px #000'}}>MIRA · ONLINE</div>

    <AbsoluteFill style={{boxShadow: `inset 0 0 0 4px ${C.cyan}66`}} />
  </AbsoluteFill>
);
