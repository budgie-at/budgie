import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHEET_TOP_MARGIN = 24;

export const useMorphingSheetListHeight = (ratio: number) => {
    const { height: windowHeight } = useWindowDimensions();
    const { top } = useSafeAreaInsets();

    return { height: Math.min(windowHeight * ratio, windowHeight - top - SHEET_TOP_MARGIN) };
};
