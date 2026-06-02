import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

interface Props {
    readonly alignToBottom?: boolean;
}

const ROW_KEYS = ['first', 'second', 'third', 'fourth'];

export const FilterSheetSkeleton = ({ alignToBottom = false }: Props) => {
    const pulseStyle = useSkeletonPulseStyle();
    const containerClassName = alignToBottom ? 'flex-1 justify-end gap-y-sm' : 'gap-y-sm';

    return (
        <Animated.View style={pulseStyle} className={containerClassName} pointerEvents="none">
            {ROW_KEYS.map(rowKey => (
                <View className="h-[64px] rounded-3xl border border-secondary-corner/50 bg-secondary-background" key={rowKey} />
            ))}
        </Animated.View>
    );
};
