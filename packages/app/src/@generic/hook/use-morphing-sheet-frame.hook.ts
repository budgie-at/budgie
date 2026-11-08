import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BOTTOM_EXTRA = 8;
const MIN_BOTTOM_INSET = 16;
const TOP_MARGIN = 24;

export const useMorphingSheetFrame = () => {
    const { bottom, top } = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();

    return { baseBottom: Math.max(bottom, MIN_BOTTOM_INSET) + BOTTOM_EXTRA, frameHeight: windowHeight - top - TOP_MARGIN };
};
