import { useWindowDimensions } from 'react-native';

const LARGE_TEXT_FONT_SCALE = 1.3;

export const useIsLargeTextSize = (): boolean => useWindowDimensions().fontScale >= LARGE_TEXT_FONT_SCALE;
