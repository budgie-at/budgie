import { useRef } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { EASE_OUT, PREPARE_DELAY_MS } from '../../constant/motion.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const FADE_IN_TIMING = { duration: 160, easing: EASE_OUT };

export const FadeInOnMount = ({ children }: Props) => {
    const opacity = useSharedValue(0);
    const hasStarted = useRef(false);

    const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

    const handleLayout = () => {
        if (hasStarted.current) {
            return;
        }

        hasStarted.current = true;
        opacity.set(withDelay(PREPARE_DELAY_MS, withTiming(1, FADE_IN_TIMING)));
    };

    return (
        <Animated.View className="flex-1" style={fadeStyle} onLayout={handleLayout}>
            {children}
        </Animated.View>
    );
};
