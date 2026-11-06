import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';

export const SCREEN_CHROME_CONFIG: ScreenChromeConfigOverridesInterface = {
    topFadeHeight: 240,
    bottomFadeHeight: 240,
    headerBackdropHeight: 240,
    intensity: 48,
    maxBlurIntensity: 48,
    colors: {
        light: { solid: 'rgba(255,255,255,1)', wash: 'rgba(255,255,255,0.05)' },
        dark: { solid: 'rgba(0,0,0,1)', wash: 'rgba(0,0,0,0.05)' }
    }
};
