import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { useTransactionList } from '../../hook/use-transaction-list.hook';
import { useGetTransactionCountQuery } from '../../query/use-get-transaction-count.query';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionListEmptyState } from '../transaction-list-empty-state/transaction-list-empty-state';
import { TransactionListUncategorizedPill } from '../transaction-list-uncategorized-pill/transaction-list-uncategorized-pill';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';

import type { ReactNode } from 'react';

interface Props {
    readonly accountId: number;
    readonly children: ReactNode;
}

const FAB_FOOTER_SPACER_MULTIPLIER = 3;

export const CollapsibleChromeTransactionList = ({ accountId, children }: Props) => {
    const { activeFilters, setInternalFilters, hasFiltersSelected, sections, loadMore, isLoading } = useTransactionList(accountId);
    const { count } = useGetTransactionCountQuery(activeFilters);

    const countLabel = isPositiveNumber(count) ? ` ${count}` : '';

    const listHeader = (
        <View>
            <View className="pb-5xl">{children}</View>

            <Text className="text-primary text-lg font-semibold pb-md">
                <Trans>Transactions</Trans>
                <Text className="text-secondary-foreground font-normal">{countLabel}</Text>
            </Text>

            <TransactionFilters
                filters={activeFilters}
                onChange={setInternalFilters}
                accountId={accountId}
                hasFiltersSelected={hasFiltersSelected}
            />

            <TransactionListUncategorizedPill filters={activeFilters} />
        </View>
    );

    return (
        <TransactionSectionsList
            sections={sections}
            onEndReached={loadMore}
            listEmptyState={<TransactionListEmptyState isLoading={isLoading} hasFiltersSelected={hasFiltersSelected} />}
            accountId={accountId}
            footerSpacerMultiplier={FAB_FOOTER_SPACER_MULTIPLIER}
            listHeader={listHeader}
            listComponent={CollapsibleChromeLegendList}
        />
    );
};
