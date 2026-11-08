import { useAnimatedStyle } from 'react-native-reanimated';

import type { MorphingSheetPageRectInterface } from '../interface/morphing-sheet-page-rect.interface';
import type { SharedValue } from 'react-native-reanimated';

const PAGE_RADIUS = 36;

export const useMorphingSheetPageRectStyle = (rect: SharedValue<MorphingSheetPageRectInterface>) =>
    useAnimatedStyle(() => {
        const { left, right, top, bottom, opacity } = rect.get();

        return { left, right, top, bottom, opacity, borderRadius: PAGE_RADIUS, borderCurve: 'continuous' };
    });
