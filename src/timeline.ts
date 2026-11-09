// The edit, in seconds. The score (scripts/score.py) and captions (scripts/captions.py) use the same times.
export const FPS = 30;
export const LENGTH = 72;
export const T = {
  boot: 0, logo: 6, map: 10, work: 20, team: 30, guard: 40, stop: 48, drop: 52, outro: 58, title: 64.5,
};
// where Mira's lines start in the mix
export const VO = {boot: 2.3, map: 10.3, work: 20.3, team: 30.3, guard: 40.1, fun: 48.1, outro: 58.4};
// the captured clips start this long before their line (the capture puts the line a few frames in)
export const CLIP_LEAD = {boot: 0.3, talk: 0.2, outro: 0.4};

export const f = (sec: number) => Math.round(sec * FPS);

export const C = {
  bg: '#04050c', cyan: '#46d3de', pink: '#ff75bf', orange: '#ffb45c', violet: '#8f7bff', green: '#3ddc97', red: '#ff5c7a',
  text: '#eaf6ff', dim: 'rgba(210,230,255,0.62)',
};
export const TEAM = [
  {name: 'lead', color: '#ff8a4c', role: 'plans & splits the work'},
  {name: 'coder', color: '#8f9bff', role: 'builds and fixes code'},
  {name: 'researcher', color: '#46d3de', role: 'markets, data, digging'},
  {name: 'marketer', color: '#c77dff', role: 'posts, articles, outreach'},
  {name: 'mira', color: '#3ddc97', role: 'runs the OS'},
];
