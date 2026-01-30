import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

export const CategorySuggestionLoadingPill = () => {
    const opacity = useSharedValue(0.5);

    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0.5, { duration: 600 })), -1);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            style={animatedStyle}
            className="flex-row items-center gap-sm px-md py-xs bg-surface-secondary rounded-full border border-outline-secondary"
        >
            <View className="w-5 h-5 rounded-full bg-outline-secondary" />
            <View className="w-16 h-3 rounded bg-outline-secondary" />
        </Animated.View>
    );
};
