import { useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { CollapsibleChromePinnedBar } from '../../../@generic/component/collapsible-chrome-pinned-bar/collapsible-chrome-pinned-bar';
import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { TRANSACTION_SECTION_HEADER_HEIGHT } from '../../constant/transaction-section-header-height.constant';
import { useTransactionList } from '../../hook/use-transaction-list.hook';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionListEmptyState } from '../transaction-list-empty-state/transaction-list-empty-state';
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
    const { activeFilters, setInternalFilters, hasFiltersSelected, sections, loadMore, isLoading } = useTransactionList(accountId);
    const [filtersY, setFiltersY] = useState(0);
    const [pinnedFiltersHeight, setPinnedFiltersHeight] = useState(0);

    const handleFiltersLayout = (event: LayoutChangeEvent) => void setFiltersY(event.nativeEvent.layout.y);

    const filtersSpacerStyle = { height: pinnedFiltersHeight };
    const stackedHeaderHeight = isNotEmptyArray(sections) ? TRANSACTION_SECTION_HEADER_HEIGHT : 0;

    const listHeader = (
        <View>
            <CollapsibleChromeScrollFade>
                <View className="pb-md">{children}</View>
            </CollapsibleChromeScrollFade>

            <View style={filtersSpacerStyle} onLayout={handleFiltersLayout} />
        </View>
    );

    return (
        <>
            <TransactionSectionsList
                sections={sections}
                onEndReached={loadMore}
                listEmptyState={<TransactionListEmptyState isLoading={isLoading} hasFiltersSelected={hasFiltersSelected} />}
                accountId={accountId}
                footerSpacerMultiplier={FAB_FOOTER_SPACER_MULTIPLIER}
                listHeader={listHeader}
                listComponent={CollapsibleChromeLegendList}
                stickyHeaderOffset={pinnedFiltersHeight}
            />

            <CollapsibleChromePinnedBar
                anchorY={filtersY}
                stackedHeaderHeight={stackedHeaderHeight}
                onHeightChange={setPinnedFiltersHeight}
            >
                <TransactionFilters
                    filters={activeFilters}
                    onChange={setInternalFilters}
                    accountId={accountId}
                    hasFiltersSelected={hasFiltersSelected}
                    leading={<TransactionListUncategorizedPill filters={activeFilters} />}
                />
            </CollapsibleChromePinnedBar>
        </>
    );
};
