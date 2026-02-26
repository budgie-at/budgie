import { useState } from 'react';
import { View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { AnalyticsPageHeader } from '../../@generic/component/analytics-page-header/analytics-page-header';
import { Page } from '../../@generic/component/page/page';
import { RecurringCalendarContent } from '../../transaction/components/recurring-calendar-content/recurring-calendar-content';
import { StatisticsContent } from '../../transaction/components/statistics-content/statistics-content';

import type { AnalyticsTabType } from '../../@generic/type/analytics-tab.type';

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<AnalyticsTabType>('statistics');

    const handleSwipeLeft = () => void setActiveTab('recurring');
    const handleSwipeRight = () => void setActiveTab('statistics');

    const swipeLeft = Gesture.Fling()
        .direction(Directions.LEFT)
        .onEnd(() => void runOnJS(handleSwipeLeft)());
    const swipeRight = Gesture.Fling()
        .direction(Directions.RIGHT)
        .onEnd(() => void runOnJS(handleSwipeRight)());
    const swipeGesture = Gesture.Race(swipeLeft, swipeRight);

    const header = <AnalyticsPageHeader activeTab={activeTab} onChangeTab={setActiveTab} />;

    return (
        <Page header={header}>
            <GestureDetector gesture={swipeGesture}>
                <View className="flex-1">{activeTab === 'statistics' ? <StatisticsContent /> : <RecurringCalendarContent />}</View>
            </GestureDetector>
        </Page>
    );
}
