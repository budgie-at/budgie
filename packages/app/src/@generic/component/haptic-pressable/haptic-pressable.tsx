import { ImpactFeedbackStyle } from 'expo-haptics';
import { useRef } from 'react';
import { GestureResponderEvent, Keyboard, Pressable } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { EASE_OUT } from '../../constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../enum/haptic-press-feedback.enum';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { useVibration } from '../../hook/use-vibration.hook';
import { AnimatedPressable } from '../animated-pressable/animated-pressable';

import type { Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

const PRESSED_SCALE = 0.96;
const MOTION_PRESS_IN_DURATION = 100;
const PRESS_OUT_DURATION = 150;
const RELEASE_SPRING = { dampingRatio: 0.55, duration: 450 };

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
    const [, hapticImpact] = useVibration();
    const isReducedMotion = useReducedMotion();
    const isLongPressActiveRef = useRef(false);
    const scale = useSharedValue(1);
    const isScaleEnabled = pressedScale !== 1;

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

    const feedbackHandlers: Record<HapticPressFeedbackEnum, () => void> = {
        [HapticPressFeedbackEnum.IMPACT]: () => void hapticImpact(ImpactFeedbackStyle.Light),
        [HapticPressFeedbackEnum.SELECTION]: () => void hapticImpact(ImpactFeedbackStyle.Rigid),
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
            scale.set(isReducedMotion ? withTiming(1, { duration: PRESS_OUT_DURATION, easing: EASE_OUT }) : withSpring(1, RELEASE_SPRING));
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
