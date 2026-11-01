import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum, TransactionFilterInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { isString } from '@rnw-community/shared';

import { AnalyticsSegmentedControl } from '../../@generic/component/analytics-segmented-control/analytics-segmented-control';
import { CollapsibleChromePage } from '../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { MenuSpacer } from '../../@generic/component/menu-spacer/menu-spacer';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../@generic/constant/max-font-size-multiplier.constant';
import { SCREEN_CHROME_CONFIG } from '../../@generic/constant/screen-chrome-config.constant';
import { getDateFilterByPeriod } from '../../@generic/utils/date/get-date-filter-by-period.util';
import { tabSwipeGesture } from '../../@generic/utils/tab-swipe-gesture.util';
import { useFormatDateRange } from '../../i18n/hook/use-format-date-range.hook';
import { StatisticsContent } from '../../transaction/components/statistics-content/statistics-content';

import { AnalyticsPageSelector } from './analytics-page.selector';

import type { AnalyticsTabType } from '../../@generic/type/analytics-tab.type';

const DEFAULT_ANALYTICS_TAB: AnalyticsTabType = 'categories';
const TABS: readonly AnalyticsTabType[] = [DEFAULT_ANALYTICS_TAB, 'tags', 'runway'];

const SNAPPING_CHROME_CONFIG = { ...SCREEN_CHROME_CONFIG, snapToCollapse: true };

const isAnalyticsTab = (value: unknown): value is AnalyticsTabType => isString(value) && TABS.some(tab => tab === value);

export default function AnalyticsPage() {
    const { tab } = useLocalSearchParams<{ tab?: string }>();

    const { t } = useLingui();
    const formatDateRange = useFormatDateRange();
    const [filters, setFilters] = useState<TransactionFilterInterface>(() => ({
        ...DEFAULT_TRANSACTION_FILTER,
        date: getDateFilterByPeriod(DatePeriodEnum.THIS_MONTH)
    }));

    const activeTab = isAnalyticsTab(tab) ? tab : DEFAULT_ANALYTICS_TAB;

    const handleChangeTab = (nextTab: AnalyticsTabType) => {
        router.setParams({ tab: nextTab });
    };

    const swipeGesture = tabSwipeGesture({ tabs: TABS, activeTab, onChangeTab: handleChangeTab });
    const tabTitles = { categories: t`Categories`, tags: t`Tags`, runway: t`Runway` };
    const periodLabel = formatDateRange(filters.date, true);
    const compactTitle = activeTab === 'runway' ? tabTitles.runway : `${tabTitles[activeTab]} · ${periodLabel}`;

    return (
        <GroupedSurface testID={AnalyticsPageSelector.Container}>
            <GestureDetector gesture={swipeGesture}>
                <View className="flex-1">
                    <CollapsibleChromePage
                        chromeConfig={SNAPPING_CHROME_CONFIG}
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
                                numberOfLines={1}
                                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                                className="text-center text-lg font-semibold text-primary"
                            >
                                {compactTitle}
                            </Text>
                        }
                    >
                        <View className="gap-y-3xl">
                            <AnalyticsSegmentedControl activeTab={activeTab} onChangeTab={handleChangeTab} />

                            <StatisticsContent activeTab={activeTab} filters={filters} onChangeFilters={setFilters} />
                        </View>

                        <MenuSpacer />
                    </CollapsibleChromePage>
                </View>
            </GestureDetector>
        </GroupedSurface>
    );
}
