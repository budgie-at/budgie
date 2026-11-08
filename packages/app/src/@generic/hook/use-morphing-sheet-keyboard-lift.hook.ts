import { useKeyboardHandler, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { interpolate, useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { MORPHING_SHEET_KEYBOARD_GAP } from '../constant/morphing-sheet-keyboard.constant';

export const useMorphingSheetKeyboardLift = (baseBottom: number) => {
    const { height: keyboardHeight, progress: keyboardProgress } = useReanimatedKeyboardAnimation();
    const isOwnKeyboard = useSharedValue(false);

    useKeyboardHandler({
        onStart: event => {
            'worklet';

            if (event.height > 0) {
                isOwnKeyboard.set(true);
            }
        },
        onEnd: event => {
            'worklet';

            if (event.height === 0) {
                isOwnKeyboard.set(false);
            }
        }
    });

    return useDerivedValue(() =>
        isOwnKeyboard.get()
            ? Math.abs(keyboardHeight.get()) + interpolate(keyboardProgress.get(), [0, 1], [0, MORPHING_SHEET_KEYBOARD_GAP - baseBottom])
            : 0
    );
};
