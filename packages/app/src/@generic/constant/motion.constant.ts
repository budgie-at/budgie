import { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

const EASE_OUT_X1 = 0.23;
const EASE_OUT_Y1 = 1;
const EASE_OUT_X2 = 0.32;
const EASE_OUT_Y2 = 1;
const EASE_IN_OUT_X1 = 0.77;
const EASE_IN_OUT_Y1 = 0;
const EASE_IN_OUT_X2 = 0.175;
const EASE_IN_OUT_Y2 = 1;

export const EASE_OUT = Easing.bezier(EASE_OUT_X1, EASE_OUT_Y1, EASE_OUT_X2, EASE_OUT_Y2);
export const EASE_IN_OUT = Easing.bezier(EASE_IN_OUT_X1, EASE_IN_OUT_Y1, EASE_IN_OUT_X2, EASE_IN_OUT_Y2);

export const MOTION_FAST_DURATION = 120;
export const MOTION_BASE_DURATION = 200;

export const PRESSED_SCALE = 0.96;
export const PRESS_RELEASE_TIMING = { duration: 150, easing: EASE_OUT };

export const BUTTON_PRESSED_SCALE = 0.94;

export const SHEET_PRESENT_SPRING = { mass: 1, stiffness: 865, damping: 52 };

export const PREPARE_DELAY_MS = 34;

export const SHEET_RESIZE_SPRING = { mass: 1, stiffness: 600, damping: 44.6 };

export const SPRING_SETTLE = { dampingRatio: 1, duration: 400 };

export const MOTION_FADE_IN = FadeIn.duration(MOTION_BASE_DURATION).easing(EASE_OUT);
export const MOTION_FADE_OUT = FadeOut.duration(MOTION_FAST_DURATION).easing(EASE_OUT);
export const MOTION_LAYOUT = LinearTransition.duration(MOTION_BASE_DURATION).easing(EASE_IN_OUT);
