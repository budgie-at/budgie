import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { interpolate, useDerivedValue } from 'react-native-reanimated';

const KEYBOARD_GAP = 16;

export const useMorphingSheetKeyboardLift = (baseBottom: number) => {
    const { height: keyboardHeight, progress: keyboardProgress } = useReanimatedKeyboardAnimation();

    return useDerivedValue(
        () => Math.abs(keyboardHeight.get()) + interpolate(keyboardProgress.get(), [0, 1], [0, KEYBOARD_GAP - baseBottom])
    );
};
