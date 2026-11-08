import { FadeIn, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';

const PRESENCE_DURATION = 200;

export const PRESENCE_ENTERING = FadeIn.duration(PRESENCE_DURATION).reduceMotion(ReduceMotion.System);
export const PRESENCE_EXITING = FadeOut.duration(PRESENCE_DURATION).reduceMotion(ReduceMotion.System);
export const PRESENCE_LAYOUT = LinearTransition.duration(PRESENCE_DURATION).reduceMotion(ReduceMotion.System);
