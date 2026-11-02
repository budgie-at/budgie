import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

export const BankIntegrationAccountRowSkeleton = () => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <Animated.View pointerEvents="none" style={pulseStyle} className="min-h-[60px] flex-row items-center gap-x-xl px-3xl py-lg">
            <View className="absolute top-0 left-[64px] right-0 h-hairline bg-surface-separator" />
            <View className="bg-secondary-corner/50 size-[36px] rounded-full" />
            <View className="flex-1 gap-y-sm">
                <View className="bg-secondary-corner/50 h-[12px] w-7/12 rounded-full" />
                <View className="bg-secondary-corner/50 h-[12px] w-4/12 rounded-full" />
            </View>
        </Animated.View>
    );
};
