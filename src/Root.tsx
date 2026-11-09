import {Composition, Still} from 'remotion';
import {Trailer} from './Trailer';
import {Thumbnail} from './Thumbnail';
import {ThumbnailMap} from './ThumbnailMap';
import {ShortAgents, SHORT_LENGTH} from './ShortAgents';
import {Avatar} from './Avatar';
import {ShortChaos, CHAOS_LENGTH} from './ShortChaos';
import {FPS, LENGTH} from './timeline';

export const Root = () => (
  <>
    <Composition id="trailer" component={Trailer} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(LENGTH * FPS)} />
    <Still id="thumb-face" component={Thumbnail} width={1280} height={720} defaultProps={{top: 'MY AI OS', bottom: 'HAS A FACE', badge: 'BUILT IN 2 DAYS'}} />
    <Still id="thumb-2days" component={Thumbnail} width={1280} height={720} defaultProps={{top: 'I BUILT AN', bottom: 'AI OS', badge: 'IN 2 DAYS · WITH A FACE'}} />
    <Still id="thumb-map" component={ThumbnailMap} width={1280} height={720} />
    {/* the channel avatar: a straight-on smile, and a peace-sign wink */}
    <Still id="avatar-smile" component={Avatar} width={800} height={800} defaultProps={{take: 'take-02'}} />
    <Still id="avatar-wink" component={Avatar} width={800} height={800} defaultProps={{take: 'take-08', zoom: 1.08, y: 0}} />
    {/* Mira Explains #1: a vertical Short */}
    <Composition id="short-agents" component={ShortAgents} width={1080} height={1920} fps={30} durationInFrames={SHORT_LENGTH} />
    {/* Chaos Chess #1: a real game from the FireChess feed, explained by Mira */}
    <Composition id="short-chaos" component={ShortChaos} width={1080} height={1920} fps={30} durationInFrames={CHAOS_LENGTH} />
  </>
);
