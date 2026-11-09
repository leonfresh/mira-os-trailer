// Mira OS: dev log 01 trailer. 72 s at 30 fps; see src/timeline.ts for the section times.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {C, f, T} from './timeline';
import {Captions, Grain, Scanlines, Vignette} from './fx';
import {Boot, GuardScene, LogoSlam, MapScene, Montage, Outro, StopScene, TeamScene, Title, WorkScene} from './scenes';

const SECTIONS: [number, number, React.FC][] = [
  [T.boot, T.logo, Boot], [T.logo, T.map, LogoSlam], [T.map, T.work, MapScene], [T.work, T.team, WorkScene],
  [T.team, T.guard, TeamScene], [T.guard, T.stop, GuardScene], [T.stop, T.drop, StopScene], [T.drop, T.outro, Montage],
  [T.outro, T.title, Outro], [T.title, 72, Title],
];

export const Trailer: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    {SECTIONS.map(([from, to, Scene]) => (
      <Sequence key={from} from={f(from)} durationInFrames={f(to) - f(from)}>
        <Scene />
      </Sequence>
    ))}
    <Vignette strength={0.55} />
    <Scanlines opacity={0.05} />
    <Grain opacity={0.06} />
    {/* the stop-down shows her words big, and the title has none */}
    <Captions hideBetween={[[f(T.stop), f(T.drop) + 12], [f(T.title), f(72)]]} />
    <Audio src={staticFile('audio/mix.wav')} />
  </AbsoluteFill>
);
