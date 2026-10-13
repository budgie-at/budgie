import { View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useSkeletonPulseStyle } from '../../hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

interface Props {
    readonly itemHeight: number;
    readonly additionalBottomPadding?: number;
    readonly topOffset?: number;
    readonly alignToBottom?: boolean;
}

const COLUMN_COUNT = 3;
const ROW_KEYS = ['first', 'second', 'third', 'fourth'];
const COLUMN_KEYS = ['left', 'center', 'right'];

export const SelectorGridSkeleton = ({ itemHeight, additionalBottomPadding = 0, topOffset, alignToBottom = false }: Props) => {
    const pulseStyle = useSkeletonPulseStyle();
    const contentContainerStyle = useFormsheetListContentStyle(additionalBottomPadding, topOffset);
    const cardStyle: ViewStyle = { height: itemHeight };
    const contentStyle: ViewStyle = {
        ...contentContainerStyle,
        flex: 1,
        ...(alignToBottom && { justifyContent: 'flex-end' })
    };

    return (
        <Animated.View className="absolute inset-0 bg-primary-reverse" style={pulseStyle} pointerEvents="none">
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
