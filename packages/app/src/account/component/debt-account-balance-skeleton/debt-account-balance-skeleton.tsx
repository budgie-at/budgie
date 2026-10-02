import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

export const DebtAccountBalanceSkeleton = () => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <Animated.View
            pointerEvents="none"
            style={pulseStyle}
            className="p-5xl border gap-y-md rounded-3xl border-secondary-corner bg-ghost-background"
        >
            <View className="flex-row items-center justify-between gap-x-sm">
                <View className="bg-secondary-corner/50 h-[12px] w-6/12 rounded-full" />
                <View className="bg-secondary-corner/50 h-[12px] w-2/12 rounded-full" />
            </View>

            <View className="bg-secondary-corner/50 h-9 w-8/12 rounded-full" />

            <View className="bg-secondary-corner/50 h-2.5 w-full rounded-full" />

            <View className="flex-row items-center justify-between gap-x-sm">
                <View className="bg-secondary-corner/50 h-[12px] w-4/12 rounded-full" />
                <View className="bg-secondary-corner/50 h-[12px] w-4/12 rounded-full" />
            </View>
        </Animated.View>
    );
};
