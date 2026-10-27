import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

export const BankIntegrationAccountRowSkeleton = () => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <Animated.View
            pointerEvents="none"
            style={pulseStyle}
            className="flex-row items-center gap-x-lg p-xl border rounded-3xl border-secondary-corner bg-ghost-background"
        >
            <View className="bg-secondary-corner/50 size-[46px] rounded-full" />
            <View className="flex-1 gap-y-sm">
                <View className="bg-secondary-corner/50 h-[12px] w-7/12 rounded-full" />
                <View className="bg-secondary-corner/50 h-[12px] w-4/12 rounded-full" />
            </View>
        </Animated.View>
    );
};
