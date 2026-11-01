import { useWindowDimensions } from 'react-native';

const ACCESSIBILITY_FONT_SCALE = 1.6;

export const useIsAccessibilityTextSize = (): boolean => useWindowDimensions().fontScale >= ACCESSIBILITY_FONT_SCALE;
