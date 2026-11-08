import Animated, { useAnimatedStyle } from 'react-native-reanimated';

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

export const LockstepStackScreen = ({ index, position, width, isTop, isSettled, onScreenLayout, children }: Props) => {
    const screenStyle = useAnimatedStyle(() => ({
        opacity: Math.max(0, 1 - Math.abs(index - position.get())),
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
