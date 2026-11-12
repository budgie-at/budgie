import { Platform } from 'react-native';

import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';

export const SCREEN_CHROME_TITLE_CLEARANCE = 8;

const IS_ANDROID = Platform.OS === 'android';

export const SCREEN_CHROME_CONFIG: ScreenChromeConfigOverridesInterface = {
    collapsedHeaderHeight: 32,
    topFadeHeight: 118,
    bottomFadeHeight: 138,
    headerBackdropHeight: 118,
    intensity: 23,
    maxBlurIntensity: 44,
    colors: IS_ANDROID
        ? {
              light: { solid: 'rgba(255,255,255,0.94)', wash: 'rgba(255,255,255,0.94)' },
              dark: { solid: 'rgba(0,0,0,0.92)', wash: 'rgba(0,0,0,0.92)' }
          }
        : {
              light: { solid: 'rgba(255,255,255,0.95)', wash: 'rgba(255,255,255,0.78)' },
              dark: { solid: 'rgba(0,0,0,0.94)', wash: 'rgba(0,0,0,0.74)' }
          },
    maskStops: {
        top: {
            0: { color: '#000000' },
            0.5: { color: '#000000' },
            0.7: { color: 'rgba(0,0,0,0.55)' },
            0.85: { color: 'rgba(0,0,0,0.2)' },
            1: { color: 'transparent' }
        },
        bottom: IS_ANDROID
            ? {
                  0: { color: 'transparent' },
                  0.25: { color: 'rgba(0,0,0,0.35)' },
                  0.5: { color: 'rgba(0,0,0,0.85)' },
                  0.75: { color: '#000000' },
                  1: { color: '#000000' }
              }
            : {
                  0: { color: 'transparent' },
                  0.25: { color: 'rgba(0,0,0,0.02)' },
                  0.5: { color: 'rgba(0,0,0,0.08)' },
                  0.75: { color: 'rgba(0,0,0,0.18)' },
                  1: { color: 'rgba(0,0,0,0.32)' }
              }
    }
};
