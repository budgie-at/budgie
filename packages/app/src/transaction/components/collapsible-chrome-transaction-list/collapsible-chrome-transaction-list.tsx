import { useState } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { CollapsibleChromePinnedBar } from '../../../@generic/component/collapsible-chrome-pinned-bar/collapsible-chrome-pinned-bar';
import { useTransactionList } from '../../hook/use-transaction-list.hook';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionListEmptyState } from '../transaction-list-empty-state/transaction-list-empty-state';
import { TransactionListPinnedDay } from '../transaction-list-pinned-day/transaction-list-pinned-day';
import { TransactionListUncategorizedPill } from '../transaction-list-uncategorized-pill/transaction-list-uncategorized-pill';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly accountId: number;
    readonly children: ReactNode;
}

const FAB_FOOTER_SPACER_MULTIPLIER = 3;

export const CollapsibleChromeTransactionList = ({ accountId, children }: Props) => {
    const { activeFilters, setInternalFilters, clearFilters, hasFiltersSelected, isClearAllVisible, sections, loadMore, isLoading } =
        useTransactionList(accountId);
    const [filtersY, setFiltersY] = useState(0);
    const [pinnedFiltersHeight, setPinnedFiltersHeight] = useState(0);
    const headerOffsets = useSharedValue<number[]>([]);

    const handleFiltersLayout = (event: LayoutChangeEvent) => void setFiltersY(event.nativeEvent.layout.y);

    const filtersSpacerStyle = { height: pinnedFiltersHeight };

    const listHeader = (
        <View>
            <View className="pb-md">{children}</View>

            <View style={filtersSpacerStyle} onLayout={handleFiltersLayout} />
        </View>
    );

    return (
        <>
            <TransactionSectionsList
                sections={sections}
                onEndReached={loadMore}
                listEmptyState={
                    <TransactionListEmptyState
                        isLoading={isLoading}
                        hasFiltersSelected={hasFiltersSelected}
                        onClearFilters={clearFilters}
                    />
                }
                accountId={accountId}
                footerSpacerMultiplier={FAB_FOOTER_SPACER_MULTIPLIER}
                listHeader={listHeader}
                listComponent={CollapsibleChromeLegendList}
                headerOffsets={headerOffsets}
            />

            <CollapsibleChromePinnedBar
                anchorY={filtersY}
                onHeightChange={setPinnedFiltersHeight}
                pinnedFooter={<TransactionListPinnedDay sections={sections} headerOffsets={headerOffsets} anchorY={filtersY} />}
            >
                <TransactionFilters
                    filters={activeFilters}
                    onChange={setInternalFilters}
                    accountId={accountId}
                    isClearAllVisible={isClearAllVisible}
                    leading={<TransactionListUncategorizedPill filters={activeFilters} />}
                />
            </CollapsibleChromePinnedBar>
        </>
    );
};
