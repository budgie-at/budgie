import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useFormsheetListStyles } from '../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

interface Props {
    readonly itemHeight: number;
    readonly additionalBottomPadding?: number;
    readonly topOffset?: number;
    readonly alignToBottom?: boolean;
}

const COLUMN_COUNT = 3;
const ROW_KEYS = ['first', 'second', 'third', 'fourth'];
const COLUMN_KEYS = ['left', 'center', 'right'];
const PULSE_DURATION = 850;
const MIN_OPACITY = 0.42;
const MAX_OPACITY = 1;

export const SelectorGridSkeleton = ({ itemHeight, additionalBottomPadding = 0, topOffset, alignToBottom = false }: Props) => {
    const opacity = useSharedValue(MAX_OPACITY);
    const { flatListStyle, contentContainerStyle } = useFormsheetListStyles(additionalBottomPadding, topOffset);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(MIN_OPACITY, { duration: PULSE_DURATION }), -1, true);
    }, [opacity]);

    const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const cardStyle: ViewStyle = { height: itemHeight };
    const outerStyle = [flatListStyle, pulseStyle];
    const contentStyle: ViewStyle = {
        ...contentContainerStyle,
        flex: 1,
        ...(alignToBottom && { justifyContent: 'flex-end' })
    };

    return (
        <Animated.View style={outerStyle} pointerEvents="none">
            <View style={contentStyle} className="gap-y-lg">
                {ROW_KEYS.map(rowKey => (
                    <View className="flex-row gap-x-lg" key={rowKey}>
                        {COLUMN_KEYS.slice(0, COLUMN_COUNT).map(columnKey => (
                            <View
                                className="flex-1 rounded-2xl border border-secondary-corner/50 bg-secondary-background"
                                key={`${rowKey}-${columnKey}`}
                                style={cardStyle}
                            />
                        ))}
                    </View>
                ))}
            </View>
        </Animated.View>
    );
};
