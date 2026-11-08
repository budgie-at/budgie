import { useAnimatedStyle } from 'react-native-reanimated';

import { MORPHING_SHEET_RADIUS } from '../constant/morphing-sheet-radius.constant';

import type { MorphingSheetPageRectInterface } from '../interface/morphing-sheet-page-rect.interface';
import type { SharedValue } from 'react-native-reanimated';

export const useMorphingSheetPageRectStyle = (rect: SharedValue<MorphingSheetPageRectInterface>) =>
    useAnimatedStyle(() => {
        const { left, right, top, bottom, opacity } = rect.get();

        return { left, right, top, bottom, opacity, borderRadius: MORPHING_SHEET_RADIUS, borderCurve: 'continuous' };
    });
