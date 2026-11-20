import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

const BUSY_STATE = { busy: true };

export const YieldHeroSkeleton = () => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <Animated.View
            style={pulseStyle}
            className="min-h-[44px] justify-center"
            pointerEvents="none"
            accessibilityState={BUSY_STATE}
            importantForAccessibility="no-hide-descendants"
        >
            <View className="h-[44px] w-[160px] rounded-xl bg-secondary-corner/50" />
        </Animated.View>
    );
};
