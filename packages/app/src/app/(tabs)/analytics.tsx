import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { isString } from '@rnw-community/shared';

import { AnalyticsPageHeader } from '../../@generic/component/analytics-page-header/analytics-page-header';
import { Page } from '../../@generic/component/page/page';
import { tabSwipeGesture } from '../../@generic/utils/tab-swipe-gesture.util';
import { StatisticsContent } from '../../transaction/components/statistics-content/statistics-content';

import { AnalyticsPageSelector } from './analytics-page.selector';

import type { AnalyticsTabType } from '../../@generic/type/analytics-tab.type';

const DEFAULT_ANALYTICS_TAB: AnalyticsTabType = 'categories';
const TABS: readonly AnalyticsTabType[] = [DEFAULT_ANALYTICS_TAB, 'tags', 'runway'];

const isAnalyticsTab = (value: unknown): value is AnalyticsTabType => isString(value) && TABS.some(tab => tab === value);

export default function AnalyticsPage() {
    const { tab } = useLocalSearchParams<{ tab?: string }>();
    const [activeTab, setActiveTab] = useState<AnalyticsTabType>(isAnalyticsTab(tab) ? tab : DEFAULT_ANALYTICS_TAB);

    const swipeGesture = tabSwipeGesture({ tabs: TABS, activeTab, onChangeTab: setActiveTab });

    const header = <AnalyticsPageHeader activeTab={activeTab} onChangeTab={setActiveTab} />;

    return (
        <Page testID={AnalyticsPageSelector.Container} header={header}>
            <GestureDetector gesture={swipeGesture}>
                <View className="flex-1">
                    <StatisticsContent activeTab={activeTab} />
                </View>
            </GestureDetector>
        </Page>
    );
}
