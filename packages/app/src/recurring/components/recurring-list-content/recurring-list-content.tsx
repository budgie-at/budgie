import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { StaticChromeLegendList } from '../../../@generic/component/static-chrome-legend-list/static-chrome-legend-list';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { RecurringListItemKindEnum } from '../../enum/recurring-list-item-kind.enum';
import { useRecurringSeriesList } from '../../hook/use-recurring-series-list.hook';
import { buildRecurringListItems } from '../../utils/build-recurring-list-items.util';
import { buildRecurringSummary } from '../../utils/build-recurring-summary.util';
import { RecurringListEmptyState } from '../recurring-list-empty-state/recurring-list-empty-state';
import { RecurringListRow } from '../recurring-list-row/recurring-list-row';
import { RecurringListSectionHeader } from '../recurring-list-section-header/recurring-list-section-header';
import { RecurringPaneSelector } from '../recurring-pane/recurring-pane.selector';
import { RecurringSummaryCard } from '../recurring-summary-card/recurring-summary-card';

import type { RecurringSectionEnum } from '../../enum/recurring-section.enum';
import type { RecurringListItemType } from '../../type/recurring-list-item.type';
import type { RecurringSeriesListItemInterface } from '@budgie/recurring';
import type { ReactNode } from 'react';

const EMPTY_SERIES: readonly RecurringSeriesListItemInterface[] = [];

const keyExtractor = (item: RecurringListItemType) => item.id;

const getItemType = (item: RecurringListItemType) => item.type;

interface Props {
    readonly header: ReactNode;
}

export const RecurringListContent = ({ header }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const { now, series } = useRecurringSeriesList();
    const [expandedSections, setExpandedSections] = useState<readonly RecurringSectionEnum[]>([]);
    const isLoading = !isDefined(series);
    const loadedSeries = series ?? EMPTY_SERIES;
    const items = buildRecurringListItems(loadedSeries, expandedSections, now);
    const stickyHeaderIndices = items.flatMap((item, index) => (item.type === RecurringListItemKindEnum.HEADER ? [index] : []));
    const summary = buildRecurringSummary(loadedSeries, now);
    const contentContainerStyle = { paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom };
    const emptyState = isLoading ? null : <RecurringListEmptyState />;

    const handleToggleSection = (section: RecurringSectionEnum) =>
        void setExpandedSections(current => (current.includes(section) ? current.filter(item => item !== section) : [...current, section]));

    const renderItem = ({ item }: { item: RecurringListItemType }) =>
        item.type === RecurringListItemKindEnum.HEADER ? (
            <RecurringListSectionHeader
                section={item.section}
                count={item.count}
                isCollapsed={item.isCollapsed}
                onToggle={handleToggleSection}
            />
        ) : (
            <RecurringListRow series={item.series} position={item.position} isPossible={item.isPossible} now={now} />
        );

    return (
        <View className="flex-1">
            <LoadingContent isLoading={isLoading} className="flex-1" containerClassName="flex-1">
                <View className="flex-1" testID={RecurringPaneSelector.List}>
                    <StaticChromeLegendList
                        data={items}
                        stickyHeaderIndices={stickyHeaderIndices}
                        keyExtractor={keyExtractor}
                        getItemType={getItemType}
                        renderItem={renderItem}
                        estimatedItemSize={64}
                        contentContainerStyle={contentContainerStyle}
                        ListHeaderComponent={
                            <View>
                                {header}
                                <RecurringSummaryCard summary={summary} now={now} />
                            </View>
                        }
                        ListEmptyComponent={emptyState}
                    />
                </View>
            </LoadingContent>
        </View>
    );
};
