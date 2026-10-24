import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';

export const SCREEN_CHROME_CONFIG: ScreenChromeConfigOverridesInterface = {
    collapsedHeaderHeight: 32,
    topFadeHeight: 56,
    bottomFadeHeight: 92,
    headerBackdropHeight: 56,
    intensity: 20,
    maxBlurIntensity: 30,
    colors: {
        light: { solid: 'rgba(255,255,255,0.45)', wash: 'rgba(255,255,255,0.05)' },
        dark: { solid: 'rgba(0,0,0,0.35)', wash: 'rgba(0,0,0,0.05)' }
    }
};
