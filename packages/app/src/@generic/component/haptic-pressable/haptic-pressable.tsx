import { ImpactFeedbackStyle } from 'expo-haptics';
import { useRef } from 'react';
import { GestureResponderEvent, Keyboard, Pressable } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { EASE_OUT, MOTION_BASE_DURATION } from '../../constant/motion.constant';
import { useVibration } from '../../hook/use-vibration.hook';
import { AnimatedPressable } from '../animated-pressable/animated-pressable';

import type { Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

const PRESSED_SCALE = 0.97;
const MOTION_PRESS_IN_DURATION = 100;

interface Props extends Omit<PressableProps, 'style'> {
    readonly style?: StyleProp<ViewStyle>;
    readonly pressedScale?: number;
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
    ...rest
}: Props) => {
    const [, hapticImpact] = useVibration();
    const isLongPressActiveRef = useRef(false);
    const scale = useSharedValue(1);
    const isScaleEnabled = pressedScale !== 1;

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

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

        hapticImpact(ImpactFeedbackStyle.Light);
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
            scale.set(withTiming(1, { duration: MOTION_BASE_DURATION, easing: EASE_OUT }));
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
