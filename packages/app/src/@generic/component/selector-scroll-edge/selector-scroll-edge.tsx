import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly scrollOffset: SharedValue<number>;
}

export const SelectorScrollEdge = ({ scrollOffset }: Props) => {
    const animatedStyle = useAnimatedStyle(() => ({ opacity: withTiming(scrollOffset.get() > 1 ? 1 : 0, { duration: 160 }) }));

    return (
        <Animated.View pointerEvents="none" className="absolute top-0 left-0 right-0 z-20" style={animatedStyle}>
            <View className="h-hairline bg-surface-separator/50" />
            <View className="h-[12px] bg-linear-to-b from-surface to-surface/0" />
        </Animated.View>
    );
};
