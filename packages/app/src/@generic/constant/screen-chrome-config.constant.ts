import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';

export const SCREEN_CHROME_CONFIG: ScreenChromeConfigOverridesInterface = {
    topFadeHeight: 146,
    bottomFadeHeight: 146,
    intensity: 20,
    maxBlurIntensity: 45,
    colors: {
        light: { solid: 'rgba(255,255,255,0.7)', wash: 'rgba(255,255,255,0.15)' },
        dark: { solid: 'rgba(0,0,0,0.4)', wash: 'rgba(0,0,0,0.08)' }
    }
};
