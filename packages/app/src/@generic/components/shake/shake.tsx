import React, { useEffect, useRef } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

interface Props {
    readonly children: React.ReactNode;
    readonly isEnabled: boolean;
}

export const Shake = ({ children, isEnabled }: Props) => {
    const translateX = useSharedValue(0);
    const prevTriggerRef = useRef<boolean>(null);

    useEffect(() => {
        if (isEnabled && isEnabled !== prevTriggerRef.current) {
            prevTriggerRef.current = isEnabled;

            translateX.value = withSequence(
                withTiming(10, { duration: 50 }),
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(-10, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        } else if (!isEnabled) {
            prevTriggerRef.current = null;
        }
    }, [isEnabled, translateX]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
