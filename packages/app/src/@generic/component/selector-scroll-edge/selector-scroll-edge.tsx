import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly scrollOffset: SharedValue<number>;
    readonly top: number;
}

export const SelectorScrollEdge = ({ scrollOffset, top }: Props) => {
    const animatedStyle = useAnimatedStyle(() => ({ top, opacity: withTiming(scrollOffset.value > 1 ? 1 : 0, { duration: 160 }) }));

    return (
        <Animated.View pointerEvents="none" className="absolute left-0 right-0 z-20" style={animatedStyle}>
            <View className="h-hairline bg-surface-separator" />
            <View className="h-[16px] bg-linear-to-b from-surface to-surface/0" />
        </Animated.View>
    );
};
