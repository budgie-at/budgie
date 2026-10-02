import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

export const DebtAccountCardSkeleton = () => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <Animated.View className="gap-y-xs" pointerEvents="none" style={pulseStyle}>
            <View className="bg-secondary-corner/50 h-[22px] w-8/12 rounded-full" />
            <View className="bg-secondary-corner/50 h-[10px] w-5/12 rounded-full" />
        </Animated.View>
    );
};
