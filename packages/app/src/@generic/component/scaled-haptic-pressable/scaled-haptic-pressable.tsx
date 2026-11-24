import { GestureResponderEvent, Pressable } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EASE_OUT, PRESS_RELEASE_TIMING } from '../../constant/motion.constant';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { AnimatedPressable } from '../animated-pressable/animated-pressable';

import type { Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

const MOTION_PRESS_IN_DURATION = 100;

interface Props extends Omit<PressableProps, 'style'> {
    readonly style?: StyleProp<ViewStyle>;
    readonly pressedScale: number;
    readonly ref?: Ref<View>;
}

export const ScaledHapticPressable = ({ onPressIn, onPressOut, disabled, style, pressedScale, ...rest }: Props) => {
    const scale = useSharedValue(1);
    const reducedMotion = useReducedMotion();
    const isScaleEnabled = !reducedMotion;

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

    const handlePressIn = (event: GestureResponderEvent) => {
        onPressIn?.(event);

        if (isScaleEnabled && !disabled) {
            scale.set(withTiming(pressedScale, { duration: MOTION_PRESS_IN_DURATION, easing: EASE_OUT }));
        }
    };

    const handlePressOut = (event: GestureResponderEvent) => {
        onPressOut?.(event);

        if (isScaleEnabled) {
            scale.set(withTiming(1, PRESS_RELEASE_TIMING));
        }
    };

    const pressableStyle = isScaleEnabled ? [style, animatedStyle] : style;
    const PressableComponent = isScaleEnabled ? AnimatedPressable : Pressable;

    return (
        <PressableComponent onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} style={pressableStyle} {...rest} />
    );
};
