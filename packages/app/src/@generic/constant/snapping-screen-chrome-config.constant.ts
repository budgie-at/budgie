import { SCREEN_CHROME_CONFIG } from './screen-chrome-config.constant';

import type { ScreenChromeConfigOverridesInterface } from '@rnw-community/react-native-screen-chrome';

export const SNAPPING_SCREEN_CHROME_CONFIG: ScreenChromeConfigOverridesInterface = { ...SCREEN_CHROME_CONFIG, snapToCollapse: true };
