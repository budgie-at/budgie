import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';

export const SCREEN_CHROME_TITLE_CLEARANCE = 8;

export const SCREEN_CHROME_CONFIG: ScreenChromeConfigOverridesInterface = {
    collapsedHeaderHeight: 32,
    topFadeHeight: 118,
    bottomFadeHeight: 138,
    headerBackdropHeight: 118,
    intensity: 23,
    maxBlurIntensity: 23,
    colors: {
        light: { solid: 'rgba(255,255,255,0.45)', wash: 'rgba(255,255,255,0.05)' },
        dark: { solid: 'rgba(0,0,0,0.3)', wash: 'rgba(0,0,0,0.05)' }
    }
};
