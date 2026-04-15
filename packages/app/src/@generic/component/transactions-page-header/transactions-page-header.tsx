import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { TransactionsTabType } from '../../type/transactions-tab-type.type';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { LayoutChangeEvent } from 'react-native';

interface TabLayoutInterface {
    x: number;
    width: number;
}

interface Props {
    readonly activeTab: TransactionsTabType;
    readonly onChangeTab: (tab: TransactionsTabType) => void;
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

const tabs: readonly TransactionsTabType[] = ['transactions', 'recurring'];

export const TransactionsPageHeader = ({ activeTab, onChangeTab }: Props) => {
    const tabLayouts = useRef<Record<TransactionsTabType, TabLayoutInterface>>({
        transactions: { x: 0, width: 0 },
        recurring: { x: 0, width: 0 }
    });
    const isIndicatorReady = useRef(false);

    const indicatorX = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);

    const handleTabPress = (tab: TransactionsTabType) => () => {
        onChangeTab(tab);
    };

    const handleTabLayout = (tab: TransactionsTabType) => (event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        tabLayouts.current[tab] = { x, width };

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
                {tabs.map(tab => (
                    <HapticPressable key={tab} onPress={handleTabPress(tab)} onLayout={handleTabLayout(tab)}>
                        <Text className={titleVariants({ isActive: activeTab === tab })}>
                            {tab === 'transactions' ? <Trans>Transactions</Trans> : <Trans>Recurring</Trans>}
                        </Text>
                    </HapticPressable>
                ))}
            </View>

            <Animated.View className="h-0.5 bg-primary rounded-full" style={indicatorStyle} />
        </View>
    );
};
