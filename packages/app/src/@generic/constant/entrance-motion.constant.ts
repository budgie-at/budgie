import { Easing } from 'react-native-reanimated';

export const ENTRANCE_DURATION = 240;
export const ENTRANCE_REDUCED_DURATION = 150;
export const ENTRANCE_DISTANCE = 8;
export const ENTRANCE_STAGGER = 40;
export const ENTRANCE_MAX_STEP = 4;
const EASE_OUT_X1 = 0.23;
const EASE_OUT_Y1 = 1;
const EASE_OUT_X2 = 0.32;
const EASE_OUT_Y2 = 1;

export const ENTRANCE_EASING = Easing.bezier(EASE_OUT_X1, EASE_OUT_Y1, EASE_OUT_X2, EASE_OUT_Y2);
