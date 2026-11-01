import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { LEGEND_LIST_STYLE } from '../../constant/legend-list.constant';
import { useStickyDefinedValue } from '../../hook/use-sticky-defined-value.hook';
import { cn } from '../../utils/cn.util';
import { BudgieLegendList } from '../budgie-legend-list/budgie-legend-list';
import { GroupedListItem } from '../grouped-list-item/grouped-list-item';
import { GroupedListSectionTitle } from '../grouped-list-section-title/grouped-list-section-title';
import { LoadingContent } from '../loading-content/loading-content';
import { SearchablePageErrorState } from '../searchable-page-error-state/searchable-page-error-state';
import { UsageFailureRow } from '../usage-failure-row/usage-failure-row';

import type { DestinationListRowInterface } from '../../interface/destination-list-row.interface';
import type { DestinationSectionInterface } from '../../interface/destination-section.interface';
import type { IdInterface } from '../../interface/id.interface';
import type { ReactNode } from 'react';

interface Props<T extends IdInterface> {
    readonly sections: readonly DestinationSectionInterface<T>[] | null;
    readonly isFailure: boolean;
    readonly onRetry: EmptyFn;
    readonly isUsageFailure: boolean;
    readonly onRetryUsage: EmptyFn;
    readonly emptyState: ReactNode;
    readonly renderRow: (item: T) => ReactNode;
}

const ESTIMATED_ROW_HEIGHT = 64;
const BOTTOM_SPACING = 24;

const keyExtractor = <T extends IdInterface>({ item }: DestinationListRowInterface<T>) => item.id.toString();

export const DestinationList = <T extends IdInterface>({
    sections,
    isFailure,
    onRetry,
    isUsageFailure,
    onRetryUsage,
    emptyState,
    renderRow
}: Props<T>) => {
    const { bottom } = useSafeAreaInsets();
    const stickySections = useStickyDefinedValue(sections);
    const isPending = !isDefined(sections);
    const rows = (stickySections ?? []).flatMap(({ title, data }) =>
        data.map((item, index) => ({
            item,
            sectionTitle: index === 0 ? title : null,
            isFirst: index === 0,
            isLast: index === data.length - 1
        }))
    );
    const contentContainerStyle = { paddingBottom: bottom + BOTTOM_SPACING };
    const accessibilityState = { busy: isPending };
    const header = isUsageFailure ? <UsageFailureRow onRetry={onRetryUsage} /> : null;

    if (isFailure || !isNotEmptyArray(rows)) {
        return (
            <ScrollView className="flex-1 px-xl" contentContainerStyle={contentContainerStyle} keyboardShouldPersistTaps="handled">
                {isFailure ? (
                    <SearchablePageErrorState onRetry={onRetry} />
                ) : (
                    <>
                        {header}
                        <LoadingContent isLoading={isPending}>{emptyState}</LoadingContent>
                    </>
                )}
            </ScrollView>
        );
    }

    const renderItem = ({ item: row, index }: { item: DestinationListRowInterface<T>; index: number }) => (
        <View className={cn(isDefined(row.sectionTitle) && index > 0 && 'pt-3xl')}>
            {isDefined(row.sectionTitle) ? <GroupedListSectionTitle title={row.sectionTitle} /> : null}
            <GroupedListItem isFirst={row.isFirst} isLast={row.isLast}>
                {renderRow(row.item)}
            </GroupedListItem>
        </View>
    );

    return (
        <View className={cn('flex-1 px-xl', isPending && 'opacity-50')} accessibilityState={accessibilityState}>
            <BudgieLegendList
                style={LEGEND_LIST_STYLE}
                data={rows}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                estimatedItemSize={ESTIMATED_ROW_HEIGHT}
                ListHeaderComponent={header}
                contentContainerStyle={contentContainerStyle}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            />
        </View>
    );
};
