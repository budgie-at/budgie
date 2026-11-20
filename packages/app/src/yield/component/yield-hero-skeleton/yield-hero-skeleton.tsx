import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const BUSY_STATE = { busy: true };

export const YieldHeroSkeleton = () => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <Animated.View
            style={pulseStyle}
            className="gap-y-xs"
            pointerEvents="none"
            accessibilityState={BUSY_STATE}
            importantForAccessibility="no-hide-descendants"
            testID={PassiveIncomeSelector.Hero}
        >
            <View className="h-[18px] justify-center">
                <View className="h-[12px] w-[140px] rounded-full bg-secondary-corner" />
            </View>
            <View className="h-[65px] justify-center">
                <View className="h-[48px] w-[180px] rounded-xl bg-secondary-corner" />
            </View>
            <View className="h-[44px] justify-center">
                <View className="h-[14px] w-[200px] rounded-full bg-secondary-corner" />
            </View>
        </Animated.View>
    );
};
