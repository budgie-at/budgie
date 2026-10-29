import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';

export const SCREEN_CHROME_CONFIG: ScreenChromeConfigOverridesInterface = {
    collapsedHeaderHeight: 32,
    smallTitleStart: 52,
    largeTitleEnd: 52,
    topFadeHeight: 130,
    bottomFadeHeight: 150,
    headerBackdropHeight: 130,
    intensity: 24,
    maxBlurIntensity: 24,
    colors: {
        light: { solid: 'rgba(255,255,255,0.7)', wash: 'rgba(255,255,255,0.05)' },
        dark: { solid: 'rgba(14,14,16,0.65)', wash: 'rgba(14,14,16,0.05)' }
    }
};
