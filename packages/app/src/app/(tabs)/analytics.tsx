import { router, useLocalSearchParams } from 'expo-router';
import { useLayoutEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isString } from '@rnw-community/shared';

import { AnalyticsPageHeader } from '../../@generic/component/analytics-page-header/analytics-page-header';
import { ChromePage } from '../../@generic/component/chrome-page/chrome-page';
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
    const headerRef = useRef<View>(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    const activeTab = isAnalyticsTab(tab) ? tab : DEFAULT_ANALYTICS_TAB;
    const contentInsetTop = insets.top + headerHeight;

    const handleChangeTab = (nextTab: AnalyticsTabType) => {
        router.setParams({ tab: nextTab });
    };
    const measureHeader = () => {
        if (isDefined(headerRef.current)) {
            setHeaderHeight(headerRef.current.getBoundingClientRect().height);
        }
    };

    useLayoutEffect(measureHeader);

    const swipeGesture = tabSwipeGesture({ tabs: TABS, activeTab, onChangeTab: handleChangeTab });

    const header = <AnalyticsPageHeader activeTab={activeTab} onChangeTab={handleChangeTab} ref={headerRef} onLayout={measureHeader} />;

    return (
        <ChromePage testID={AnalyticsPageSelector.Container} header={header}>
            <GestureDetector gesture={swipeGesture}>
                <View className="flex-1">
                    <StatisticsContent activeTab={activeTab} contentInsetTop={contentInsetTop} />
                </View>
            </GestureDetector>
        </ChromePage>
    );
}
