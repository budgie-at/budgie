import { easeGradient } from 'react-native-easing-gradient';

import type { EdgeFadePosition, ScreenChromeConfigInterface } from '@rnw-community/react-native-screen-chrome';

const toGradientTuple = <T>(items: readonly T[]): readonly [T, T, ...T[]] => [items[0], items[1], ...items.slice(2)];

export const getEdgeFadeMaskStops = (maskStops: ScreenChromeConfigInterface['maskStops'], position: EdgeFadePosition) => {
    const { colors, locations } = easeGradient({ colorStops: maskStops[position] });

    return { colors: toGradientTuple(colors), locations: toGradientTuple(locations) };
};
