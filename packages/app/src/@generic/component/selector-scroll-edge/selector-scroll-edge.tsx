import { View } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EASE_OUT } from '../../constant/motion.constant';

import type { SharedValue } from 'react-native-reanimated';

const EDGE_TIMING = { duration: 160, easing: EASE_OUT };

interface Props {
    readonly scrollOffset: SharedValue<number>;
}

export const SelectorScrollEdge = ({ scrollOffset }: Props) => {
    const opacity = useSharedValue(0);

    useAnimatedReaction(
        () => scrollOffset.get() > 1,
        (isScrolled, previous) => {
            if (isScrolled !== previous) {
                opacity.set(withTiming(isScrolled ? 1 : 0, EDGE_TIMING));
            }
        }
    );

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

    return (
        <Animated.View pointerEvents="none" className="absolute top-0 left-0 right-0 z-20" style={animatedStyle}>
            <View className="h-hairline bg-surface-separator/50" />
            <View className="h-[12px] bg-linear-to-b from-surface to-surface/0" />
        </Animated.View>
    );
};
