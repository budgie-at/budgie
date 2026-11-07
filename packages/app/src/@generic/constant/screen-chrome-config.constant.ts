import { FLOATING_TAB_BAR_HEIGHT } from './floating-tab-bar.constant';

import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';

export const SCREEN_CHROME_TITLE_CLEARANCE = 8;
export const SCREEN_CHROME_TOP_FADE_LENGTH = 40;
const SCREEN_CHROME_BOTTOM_FADE_LENGTH = 44;

export const SCREEN_CHROME_CONFIG: ScreenChromeConfigOverridesInterface = {
    bottomFadeHeight: FLOATING_TAB_BAR_HEIGHT + SCREEN_CHROME_BOTTOM_FADE_LENGTH,
    intensity: 48,
    maxBlurIntensity: 48,
    colors: {
        light: { solid: 'rgba(255,255,255,1)', wash: 'rgba(255,255,255,0.05)' },
        dark: { solid: 'rgba(0,0,0,1)', wash: 'rgba(0,0,0,0.05)' }
    }
};
