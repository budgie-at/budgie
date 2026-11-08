import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { interpolate, useDerivedValue } from 'react-native-reanimated';

import { MORPHING_SHEET_KEYBOARD_GAP } from '../constant/morphing-sheet-keyboard.constant';

export const useMorphingSheetKeyboardLift = (baseBottom: number) => {
    const { height: keyboardHeight, progress: keyboardProgress } = useReanimatedKeyboardAnimation();

    return useDerivedValue(
        () => Math.abs(keyboardHeight.get()) + interpolate(keyboardProgress.get(), [0, 1], [0, MORPHING_SHEET_KEYBOARD_GAP - baseBottom])
    );
};
