import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

export const DebtAccountCardFooterSkeleton = () => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <Animated.View className="gap-y-sm" pointerEvents="none" style={pulseStyle}>
            <View className="flex-row items-baseline justify-between gap-x-sm">
                <View className="bg-secondary-corner/50 h-[10px] w-4/12 rounded-full" />
                <View className="bg-secondary-corner/50 h-[10px] w-2/12 rounded-full" />
            </View>

            <View className="bg-secondary-corner/50 h-1.5 w-full rounded-full" />
        </Animated.View>
    );
};
