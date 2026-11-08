import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { scheduleOnRN } from 'react-native-worklets';

import { MORPHING_SHEET_KEYBOARD_GAP, MORPHING_SHEET_KEYBOARD_TOP_CLEARANCE } from '../constant/morphing-sheet-keyboard.constant';

import { useIsAccessibilityTextSize } from './use-is-accessibility-text-size.hook';
import { useMorphingSheetFrame } from './use-morphing-sheet-frame.hook';

export const useMorphingSheetListHeight = (ratio: number) => {
    const { height: windowHeight } = useWindowDimensions();
    const { baseBottom, frameHeight } = useMorphingSheetFrame();
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    useKeyboardHandler({
        onStart: event => {
            'worklet';

            scheduleOnRN(setKeyboardHeight, event.height);
        }
    });

    const ratioHeight = isAccessibilityTextSize ? frameHeight : windowHeight * ratio;
    const aboveKeyboardHeight = frameHeight + MORPHING_SHEET_KEYBOARD_TOP_CLEARANCE - MORPHING_SHEET_KEYBOARD_GAP - keyboardHeight;

    return { height: Math.min(ratioHeight, frameHeight - baseBottom, aboveKeyboardHeight) };
};
