import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { HERO_FIGURE_METRICS } from '../../../@generic/constant/hero-figure-metrics.constant';
import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';
import { YIELD_HERO_CAPTION_HEIGHT, YIELD_HERO_LINE_MIN_HEIGHT } from '../../constant/yield-hero-metrics.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const FIGURE_BAR_RATIO = 0.9;
const BUSY_STATE = { busy: true };
const CAPTION_STYLE = { minHeight: YIELD_HERO_CAPTION_HEIGHT };
const INFO_STYLE = { width: YIELD_HERO_CAPTION_HEIGHT, height: YIELD_HERO_CAPTION_HEIGHT };
const FIGURE_STYLE = { height: HERO_FIGURE_METRICS.fontSize, lineHeight: HERO_FIGURE_METRICS.fontSize };
const FIGURE_BAR_STYLE = { height: Math.round(HERO_FIGURE_METRICS.fontSize * FIGURE_BAR_RATIO) };
const LINE_STYLE = { minHeight: YIELD_HERO_LINE_MIN_HEIGHT };

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
            <View className="flex-row items-center gap-x-[4px]">
                <View className="shrink justify-center" style={CAPTION_STYLE}>
                    <View className="h-[13px] w-[153px] rounded-full bg-secondary-corner" />
                </View>
                <View className="rounded-full bg-secondary-corner" style={INFO_STYLE} />
            </View>
            <View className="gap-y-xs">
                <View style={FIGURE_STYLE}>
                    <View className="w-[180px] rounded-xl bg-secondary-corner" style={FIGURE_BAR_STYLE} />
                </View>
                <View className="justify-center" style={LINE_STYLE}>
                    <View className="h-[20px] justify-center">
                        <View className="h-[14px] w-[200px] rounded-full bg-secondary-corner" />
                    </View>
                    <View className="mt-[8px] h-[22px] w-[217px] rounded-full bg-secondary-corner" />
                </View>
            </View>
        </Animated.View>
    );
};
