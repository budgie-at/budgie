import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EASE_OUT } from '../../constant/motion.constant';
import { LockstepScreenSettledProvider } from '../../context/lockstep-stack.context';

import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly index: number;
    readonly position: SharedValue<number>;
    readonly width: number;
    readonly isTop: boolean;
    readonly isSettled: boolean;
    readonly onScreenLayout: (index: number) => void;
    readonly children: ReactNode;
}

const FADE_IN_TIMING = { duration: 160, easing: EASE_OUT };

export const LockstepStackScreen = ({ index, position, width, isTop, isSettled, onScreenLayout, children }: Props) => {
    const opacity = useSharedValue(index === 0 ? 1 : 0);

    useEffect(() => {
        opacity.set(withTiming(1, FADE_IN_TIMING));
    }, [opacity]);

    const screenStyle = useAnimatedStyle(() => ({
        opacity: opacity.get(),
        transform: [{ translateX: (index - position.get()) * width }]
    }));

    const handleLayout = () => {
        onScreenLayout(index);
    };

    const pointerEvents = isTop ? 'auto' : 'none';
    const accessibilityImportance = isTop ? 'auto' : 'no-hide-descendants';

    return (
        <Animated.View
            className="bg-sheet-surface absolute inset-0"
            style={screenStyle}
            pointerEvents={pointerEvents}
            accessibilityElementsHidden={!isTop}
            importantForAccessibility={accessibilityImportance}
            onLayout={handleLayout}
        >
            <LockstepScreenSettledProvider value={isSettled}>{children}</LockstepScreenSettledProvider>
        </Animated.View>
    );
};
