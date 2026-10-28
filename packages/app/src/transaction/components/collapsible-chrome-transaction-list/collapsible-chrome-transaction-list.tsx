import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { useTransactionList } from '../../hook/use-transaction-list.hook';
import { useGetTransactionCountQuery } from '../../query/use-get-transaction-count.query';
import { PinnedTransactionFilters } from '../pinned-transaction-filters/pinned-transaction-filters';
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
    const { count } = useGetTransactionCountQuery(activeFilters);
    const [filtersY, setFiltersY] = useState(0);
    const [pinnedFiltersHeight, setPinnedFiltersHeight] = useState(0);

    const handleFiltersLayout = (event: LayoutChangeEvent) => void setFiltersY(event.nativeEvent.layout.y);

    const countLabel = isPositiveNumber(count) ? ` ${count}` : '';

    const listHeader = (
        <View>
            <View className="pb-5xl">{children}</View>

            <Text className="text-primary text-lg font-semibold pb-md">
                <Trans>Transactions</Trans>
                <Text className="text-secondary-foreground font-normal">{countLabel}</Text>
            </Text>

            <View onLayout={handleFiltersLayout}>
                <TransactionFilters
                    filters={activeFilters}
                    onChange={setInternalFilters}
                    accountId={accountId}
                    hasFiltersSelected={hasFiltersSelected}
                />
            </View>

            <TransactionListUncategorizedPill filters={activeFilters} />
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

            <PinnedTransactionFilters
                filters={activeFilters}
                onChange={setInternalFilters}
                accountId={accountId}
                hasFiltersSelected={hasFiltersSelected}
                anchorY={filtersY}
                onHeightChange={setPinnedFiltersHeight}
            />
        </>
    );
};
