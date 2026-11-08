import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MORPHING_SHEET_MAX_WIDTH } from '../constant/morphing-sheet-max-width.constant';

const BOTTOM_EXTRA = 8;
const MIN_BOTTOM_INSET = 16;
const TOP_MARGIN = 24;
const SIDE_MARGIN = 16;

export const useMorphingSheetFrame = () => {
    const { bottom, top } = useSafeAreaInsets();
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();
    const frameWidth = Math.min(windowWidth - SIDE_MARGIN * 2, MORPHING_SHEET_MAX_WIDTH);

    return {
        baseBottom: Math.max(bottom, MIN_BOTTOM_INSET) + BOTTOM_EXTRA,
        frameHeight: windowHeight - top - TOP_MARGIN,
        frameInset: (windowWidth - frameWidth) / 2
    };
};
