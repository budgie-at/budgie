import { View } from 'react-native';

import { CollapsibleChromeLegendList } from '../../../@generic/component/collapsible-chrome-legend-list/collapsible-chrome-legend-list';
import { useTransactionList } from '../../hook/use-transaction-list.hook';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionListEmptyState } from '../transaction-list-empty-state/transaction-list-empty-state';
import { TransactionListMeta } from '../transaction-list-meta/transaction-list-meta';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';

import type { ReactNode } from 'react';

interface Props {
    readonly accountId: number;
    readonly children: ReactNode;
}

const FAB_FOOTER_SPACER_MULTIPLIER = 3;

export const CollapsibleChromeTransactionList = ({ accountId, children }: Props) => {
    const { activeFilters, setInternalFilters, hasFiltersSelected, sections, loadMore, isLoading } = useTransactionList(accountId);

    const listHeader = (
        <View>
            <View className="gap-y-md pb-xl">{children}</View>

            <TransactionFilters
                filters={activeFilters}
                onChange={setInternalFilters}
                accountId={accountId}
                hasFiltersSelected={hasFiltersSelected}
            />

            <TransactionListMeta filters={activeFilters} />
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
