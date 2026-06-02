import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface Props {
    readonly alignToBottom?: boolean;
}

const ROW_KEYS = ['first', 'second', 'third', 'fourth'];
const PULSE_DURATION = 850;
const MIN_OPACITY = 0.42;
const MAX_OPACITY = 1;

export const FilterSheetSkeleton = ({ alignToBottom = false }: Props) => {
    const opacity = useSharedValue(MAX_OPACITY);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(MIN_OPACITY, { duration: PULSE_DURATION }), -1, true);
    }, [opacity]);

    const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const containerClassName = alignToBottom ? 'flex-1 justify-end gap-y-sm' : 'gap-y-sm';

    return (
        <Animated.View style={pulseStyle} className={containerClassName} pointerEvents="none">
            {ROW_KEYS.map(rowKey => (
                <View className="h-[64px] rounded-3xl border border-secondary-corner/50 bg-secondary-background" key={rowKey} />
            ))}
        </Animated.View>
    );
};
