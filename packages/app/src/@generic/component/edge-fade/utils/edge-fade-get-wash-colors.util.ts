import type { EdgeFadePosition, ScreenChromeColorSetInterface } from '@rnw-community/react-native-screen-chrome';

export const getEdgeFadeWashColors = (position: EdgeFadePosition, colorSet: ScreenChromeColorSetInterface): readonly [string, string] =>
    position === 'top' ? [colorSet.solid, colorSet.wash] : [colorSet.wash, colorSet.solid];
