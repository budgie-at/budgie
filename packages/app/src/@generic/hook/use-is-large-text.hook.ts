import { useWindowDimensions } from 'react-native';

const LARGE_TEXT_FONT_SCALE = 1.35;

export const useIsLargeText = (): boolean => useWindowDimensions().fontScale >= LARGE_TEXT_FONT_SCALE;
