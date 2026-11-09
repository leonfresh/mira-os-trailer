// Mira's channel avatar (800x800; YouTube shows it as a circle, so the face sits in the middle and the ring hugs
// the circle's edge). Built from a 2x capture of her (scripts/avatar_capture.py -> public/avatar/take-NN.png).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C} from './timeline';

export const Avatar: React.FC<{take: string; zoom?: number; y?: number}> = ({take, zoom = 1.12, y = -10}) => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, #14254a 0%, #070b18 62%, #03050b 100%)`}}>
    {/* her, a touch larger than the frame so the face fills the circle */}
    <AbsoluteFill style={{transform: `scale(${zoom}) translateY(${y}px)`}}>
      <Img src={staticFile(`avatar/${take}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    {/* colour: a cyan glow from below-left, pink from above-right (her hair tips and suit) */}
    <AbsoluteFill style={{background: `radial-gradient(circle at 18% 88%, ${C.cyan}38 0%, transparent 45%), radial-gradient(circle at 85% 12%, ${C.pink}30 0%, transparent 42%)`, mixBlendMode: 'screen'}} />
    {/* fade the corners (outside the circle) to dark, and a glowing ring just inside YouTube's crop */}
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, transparent 58%, rgba(3,5,11,0.55) 66%, #03050b 72%)'}} />
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: 760, height: 760, borderRadius: '50%', border: `7px solid ${C.cyan}`, boxShadow: `0 0 30px ${C.cyan}, inset 0 0 30px ${C.cyan}88`}} />
    </AbsoluteFill>
  </AbsoluteFill>
);
