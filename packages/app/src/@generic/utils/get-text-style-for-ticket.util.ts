import { StyleProp, TextStyle } from 'react-native';

const DEFAULT_LINE_HEIGHT_MULTIPLIER = 1.1;

export const getTextStyleForTicket = (fontSize: number, lineHeightMultiplier = DEFAULT_LINE_HEIGHT_MULTIPLIER): StyleProp<TextStyle> => ({
    fontSize,
    height: fontSize,
    lineHeight: fontSize * lineHeightMultiplier,
    textAlign: 'center'
});
