import { ImpactFeedbackStyle } from 'expo-haptics';
import { useRef } from 'react';
import { GestureResponderEvent, Keyboard, Pressable } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { EASE_OUT, PRESSED_SCALE, PRESS_RELEASE_TIMING } from '../../constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../enum/haptic-press-feedback.enum';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { useVibration } from '../../hook/use-vibration.hook';
import { AnimatedPressable } from '../animated-pressable/animated-pressable';

import type { Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

const MOTION_PRESS_IN_DURATION = 100;

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
    const scale = useSharedValue(1);
    const reducedMotion = useReducedMotion();
    const isScaleEnabled = pressedScale !== 1 && !reducedMotion;

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

    const feedbackHandlers: Record<HapticPressFeedbackEnum, () => void> = {
        [HapticPressFeedbackEnum.IMPACT]: () => void hapticImpact(ImpactFeedbackStyle.Light),
        [HapticPressFeedbackEnum.SELECTION]: () => void hapticSelection(),
        [HapticPressFeedbackEnum.COMMIT]: () => void hapticImpact(ImpactFeedbackStyle.Medium),
        [HapticPressFeedbackEnum.DESTRUCTIVE]: () => void hapticImpact(ImpactFeedbackStyle.Heavy),
        [HapticPressFeedbackEnum.NONE]: emptyFn
    };

    const handlePressIn = (event: GestureResponderEvent) => {
        onPressIn?.(event);

        if (isScaleEnabled && !disabled) {
            scale.set(withTiming(pressedScale, { duration: MOTION_PRESS_IN_DURATION, easing: EASE_OUT }));
        }
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

        if (isScaleEnabled) {
            scale.set(withTiming(1, PRESS_RELEASE_TIMING));
        }

        if (isLongPressActiveRef.current) {
            isLongPressActiveRef.current = false;
        }
    };

    const pressableStyle = isScaleEnabled ? [style, animatedStyle] : style;
    const PressableComponent = isScaleEnabled ? AnimatedPressable : Pressable;

    return (
        <PressableComponent
            hitSlop={10}
            {...(isDefined(onLongPress) && { onLongPress: handleLongPress })}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={pressableStyle}
            {...rest}
        />
    );
};
