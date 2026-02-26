import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AnalyticsTabType } from '../../type/analytics-tab.type';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { LayoutChangeEvent } from 'react-native';

interface TabLayoutInterface {
    x: number;
    width: number;
}

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly onChangeTab: (tab: AnalyticsTabType) => void;
}

const INDICATOR_SPRING = { damping: 28, stiffness: 400, mass: 0.8 };

const titleVariants = cva('text-3xl font-medium', {
    variants: {
        isActive: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const AnalyticsPageHeader = ({ activeTab, onChangeTab }: Props) => {
    const isStatisticsActive = activeTab === 'statistics';
    const isRecurringActive = activeTab === 'recurring';

    const tabLayouts = useRef<Record<AnalyticsTabType, TabLayoutInterface>>({
        statistics: { x: 0, width: 0 },
        recurring: { x: 0, width: 0 }
    });
    const isIndicatorReady = useRef(false);

    const indicatorX = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);

    const handleStatisticsPress = () => {
        onChangeTab('statistics');
    };

    const handleRecurringPress = () => {
        onChangeTab('recurring');
    };

    const handleStatisticsLayout = (event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        tabLayouts.current.statistics = { x, width };

        if (isStatisticsActive && !isIndicatorReady.current) {
            indicatorX.set(x);
            indicatorWidth.set(width);
            isIndicatorReady.current = true;
        }
    };

    const handleRecurringLayout = (event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        tabLayouts.current.recurring = { x, width };

        if (isRecurringActive && !isIndicatorReady.current) {
            indicatorX.set(x);
            indicatorWidth.set(width);
            isIndicatorReady.current = true;
        }
    };

    useEffect(() => {
        if (!isIndicatorReady.current) {
            return;
        }

        const target = tabLayouts.current[activeTab];
        indicatorX.set(withSpring(target.x, INDICATOR_SPRING));
        indicatorWidth.set(withSpring(target.width, INDICATOR_SPRING));
    }, [activeTab, indicatorX, indicatorWidth]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.value }],
        width: indicatorWidth.value
    }));

    return (
        <View className="px-5xl pb-md gap-y-sm">
            <View className="flex-row items-center gap-x-xl">
                <HapticPressable onPress={handleStatisticsPress} onLayout={handleStatisticsLayout}>
                    <Text className={titleVariants({ isActive: isStatisticsActive })}>
                        <Trans>Statistics</Trans>
                    </Text>
                </HapticPressable>

                <HapticPressable onPress={handleRecurringPress} onLayout={handleRecurringLayout}>
                    <Text className={titleVariants({ isActive: isRecurringActive })}>
                        <Trans>Recurring</Trans>
                    </Text>
                </HapticPressable>
            </View>

            <Animated.View className="h-0.5 bg-primary rounded-full" style={indicatorStyle} />
        </View>
    );
};
