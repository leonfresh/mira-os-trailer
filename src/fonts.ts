import {loadFont as orbitron} from '@remotion/google-fonts/Orbitron';
import {loadFont as mono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as inter} from '@remotion/google-fonts/Inter';

export const DISPLAY = orbitron('normal', {weights: ['500', '700', '900'], subsets: ['latin']}).fontFamily;
export const MONO = mono('normal', {weights: ['400', '500', '700'], subsets: ['latin']}).fontFamily;
export const SANS = inter('normal', {weights: ['400', '500', '600', '800'], subsets: ['latin']}).fontFamily;
