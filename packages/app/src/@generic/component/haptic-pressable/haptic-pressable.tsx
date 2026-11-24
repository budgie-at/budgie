import { ImpactFeedbackStyle } from 'expo-haptics';
import { useRef } from 'react';
import { GestureResponderEvent, Keyboard, Pressable } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { PRESSED_SCALE } from '../../constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../enum/haptic-press-feedback.enum';
import { useVibration } from '../../hook/use-vibration.hook';
import { ScaledHapticPressable } from '../scaled-haptic-pressable/scaled-haptic-pressable';

import type { Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
    readonly style?: StyleProp<ViewStyle>;
    readonly pressedScale?: number;
    readonly pressFeedback?: HapticPressFeedbackEnum;
    readonly ref?: Ref<View>;
}

export const HapticPressable = ({
    onLongPress,
    onPress,
    onPressIn,
    onPressOut,
    disabled,
    style,
    pressedScale = PRESSED_SCALE,
    pressFeedback = HapticPressFeedbackEnum.IMPACT,
    ...rest
}: Props) => {
    const [, hapticImpact, hapticSelection] = useVibration();
    const isLongPressActiveRef = useRef(false);

    const feedbackHandlers: Record<HapticPressFeedbackEnum, () => void> = {
        [HapticPressFeedbackEnum.IMPACT]: () => void hapticImpact(ImpactFeedbackStyle.Light),
        [HapticPressFeedbackEnum.SELECTION]: () => void hapticSelection(),
        [HapticPressFeedbackEnum.COMMIT]: () => void hapticImpact(ImpactFeedbackStyle.Medium),
        [HapticPressFeedbackEnum.DESTRUCTIVE]: () => void hapticImpact(ImpactFeedbackStyle.Heavy),
        [HapticPressFeedbackEnum.NONE]: emptyFn
    };

    const handlePress = (event: GestureResponderEvent) => {
        if (disabled) {
            return;
        }

        if (isLongPressActiveRef.current) {
            isLongPressActiveRef.current = false;

            return;
        }

        feedbackHandlers[pressFeedback]();
        Keyboard.dismiss();
        onPress?.(event);
    };

    const handleLongPress = (event: GestureResponderEvent) => {
        if (disabled) {
            return;
        }

        isLongPressActiveRef.current = true;
        onLongPress?.(event);
    };

    const handlePressOut = (event: GestureResponderEvent) => {
        onPressOut?.(event);

        if (isLongPressActiveRef.current) {
            isLongPressActiveRef.current = false;
        }
    };

    if (pressedScale === 1) {
        return (
            <Pressable
                hitSlop={10}
                {...(isDefined(onLongPress) && { onLongPress: handleLongPress })}
                onPress={handlePress}
                onPressIn={onPressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={style}
                {...rest}
            />
        );
    }

    return (
        <ScaledHapticPressable
            hitSlop={10}
            {...(isDefined(onLongPress) && { onLongPress: handleLongPress })}
            onPress={handlePress}
            onPressIn={onPressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={style}
            pressedScale={pressedScale}
            {...rest}
        />
    );
};
