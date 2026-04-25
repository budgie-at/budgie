import { cva } from 'class-variance-authority';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { TabConfigInterface } from '../../interface/tab-config.interface';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { LayoutChangeEvent } from 'react-native';

interface Props<T extends string> {
    readonly tabs: readonly TabConfigInterface<T>[];
    readonly activeTab: T;
    readonly onChangeTab: (tab: T) => void;
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

export const AnimatedTabBar = <T extends string>({ tabs, activeTab, onChangeTab }: Props<T>) => {
    const tabLayouts = useRef(new Map<T, { readonly x: number; readonly width: number }>());
    const isIndicatorReady = useRef(false);

    const indicatorX = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);

    const handleTabPress = (tab: T) => () => {
        onChangeTab(tab);
    };

    const handleTabLayout = (tab: T) => (event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        tabLayouts.current.set(tab, { x, width });

        if (activeTab === tab && !isIndicatorReady.current) {
            indicatorX.set(x);
            indicatorWidth.set(width);
            isIndicatorReady.current = true;
        }
    };

    useEffect(() => {
        if (!isIndicatorReady.current) {
            return;
        }

        const target = tabLayouts.current.get(activeTab);
        if (!isDefined(target)) {
            return;
        }

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
                {tabs.map(tab => (
                    <HapticPressable
                        key={tab.key}
                        onPress={handleTabPress(tab.key)}
                        onLayout={handleTabLayout(tab.key)}
                        testID={tab.testID}
                    >
                        <Text className={titleVariants({ isActive: activeTab === tab.key })}>{tab.label}</Text>
                    </HapticPressable>
                ))}
            </View>

            <Animated.View className="h-0.5 bg-primary rounded-full" style={indicatorStyle} />
        </View>
    );
};
