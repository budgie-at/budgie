import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isString } from '@rnw-community/shared';

import { AnalyticsPageHeader } from '../../@generic/component/analytics-page-header/analytics-page-header';
import { tabSwipeGesture } from '../../@generic/utils/tab-swipe-gesture.util';
import { StatisticsContent } from '../../transaction/components/statistics-content/statistics-content';

import { AnalyticsPageSelector } from './analytics-page.selector';

import type { AnalyticsTabType } from '../../@generic/type/analytics-tab.type';

const DEFAULT_ANALYTICS_TAB: AnalyticsTabType = 'categories';
const TABS: readonly AnalyticsTabType[] = [DEFAULT_ANALYTICS_TAB, 'tags', 'runway'];

const isAnalyticsTab = (value: unknown): value is AnalyticsTabType => isString(value) && TABS.some(tab => tab === value);

export default function AnalyticsPage() {
    const { tab } = useLocalSearchParams<{ tab?: string }>();
    const insets = useSafeAreaInsets();

    const activeTab = isAnalyticsTab(tab) ? tab : DEFAULT_ANALYTICS_TAB;
    const headerStyle = { paddingTop: insets.top };

    const handleChangeTab = (nextTab: AnalyticsTabType) => {
        router.setParams({ tab: nextTab });
    };

    const swipeGesture = tabSwipeGesture({ tabs: TABS, activeTab, onChangeTab: handleChangeTab });

    return (
        <View className="flex-1" testID={AnalyticsPageSelector.Container}>
            <GestureDetector gesture={swipeGesture}>
                <View className="flex-1">
                    <StatisticsContent activeTab={activeTab} />
                </View>
            </GestureDetector>

            <View className="absolute top-0 right-0 left-0 z-10" pointerEvents="box-none" style={headerStyle}>
                <AnalyticsPageHeader activeTab={activeTab} onChangeTab={handleChangeTab} />
            </View>
        </View>
    );
}
