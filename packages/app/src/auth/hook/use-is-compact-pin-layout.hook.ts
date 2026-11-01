import { useWindowDimensions } from 'react-native';

const COMPACT_PIN_LAYOUT_MAX_HEIGHT = 760;

const COMPACT_PIN_LAYOUT_MIN_FONT_SCALE = 1.2;

export const useIsCompactPinLayout = (): boolean => {
    const { height, fontScale } = useWindowDimensions();

    return height < COMPACT_PIN_LAYOUT_MAX_HEIGHT || fontScale > COMPACT_PIN_LAYOUT_MIN_FONT_SCALE;
};
