import { useWindowDimensions } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { MORPHING_SHEET_KEYBOARD_GAP, MORPHING_SHEET_KEYBOARD_TOP_CLEARANCE } from '../constant/morphing-sheet-keyboard.constant';

import { useIsAccessibilityTextSize } from './use-is-accessibility-text-size.hook';
import { useMorphingSheetFrame } from './use-morphing-sheet-frame.hook';

export const useMorphingSheetListHeight = (ratio: number) => {
    const { height: windowHeight } = useWindowDimensions();
    const { baseBottom, frameHeight } = useMorphingSheetFrame();
    const keyboardHeight = useKeyboardState(state => state.height);
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const ratioHeight = isAccessibilityTextSize ? frameHeight : windowHeight * ratio;
    const aboveKeyboardHeight = frameHeight + MORPHING_SHEET_KEYBOARD_TOP_CLEARANCE - MORPHING_SHEET_KEYBOARD_GAP - keyboardHeight;

    return { height: Math.min(ratioHeight, frameHeight - baseBottom, aboveKeyboardHeight) };
};
