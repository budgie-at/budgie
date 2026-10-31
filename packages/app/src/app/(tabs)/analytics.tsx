import { Trans } from '@lingui/react/macro';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { isString } from '@rnw-community/shared';

import { AnalyticsSegmentedControl } from '../../@generic/component/analytics-segmented-control/analytics-segmented-control';
import { CollapsibleChromePage } from '../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { MenuSpacer } from '../../@generic/component/menu-spacer/menu-spacer';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../@generic/constant/max-font-size-multiplier.constant';
import { tabSwipeGesture } from '../../@generic/utils/tab-swipe-gesture.util';
import { StatisticsContent } from '../../transaction/components/statistics-content/statistics-content';

import { AnalyticsPageSelector } from './analytics-page.selector';

import type { AnalyticsTabType } from '../../@generic/type/analytics-tab.type';

const DEFAULT_ANALYTICS_TAB: AnalyticsTabType = 'categories';
const TABS: readonly AnalyticsTabType[] = [DEFAULT_ANALYTICS_TAB, 'tags', 'runway'];

const isAnalyticsTab = (value: unknown): value is AnalyticsTabType => isString(value) && TABS.some(tab => tab === value);

export default function AnalyticsPage() {
    const { tab } = useLocalSearchParams<{ tab?: string }>();

    const activeTab = isAnalyticsTab(tab) ? tab : DEFAULT_ANALYTICS_TAB;

    const handleChangeTab = (nextTab: AnalyticsTabType) => {
        router.setParams({ tab: nextTab });
    };

    const swipeGesture = tabSwipeGesture({ tabs: TABS, activeTab, onChangeTab: handleChangeTab });

    return (
        <GroupedSurface testID={AnalyticsPageSelector.Container}>
            <GestureDetector gesture={swipeGesture}>
                <View className="flex-1">
                    <CollapsibleChromePage
                        largeTitle={
                            <Text
                                accessibilityRole="header"
                                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                                className="text-3xl font-semibold text-primary"
                            >
                                <Trans>Analytics</Trans>
                            </Text>
                        }
                        smallTitle={
                            <Text
                                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                                className="text-center text-lg font-semibold text-primary"
                            >
                                <Trans>Analytics</Trans>
                            </Text>
                        }
                    >
                        <View className="gap-y-3xl">
                            <AnalyticsSegmentedControl activeTab={activeTab} onChangeTab={handleChangeTab} />

                            <StatisticsContent activeTab={activeTab} />
                        </View>

                        <MenuSpacer />
                    </CollapsibleChromePage>
                </View>
            </GestureDetector>
        </GroupedSurface>
    );
}
