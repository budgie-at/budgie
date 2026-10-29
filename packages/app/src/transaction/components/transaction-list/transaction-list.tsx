import { View } from 'react-native';

import { useTransactionList } from '../../hook/use-transaction-list.hook';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionListCount } from '../transaction-list-count/transaction-list-count';
import { TransactionListEmptyState } from '../transaction-list-empty-state/transaction-list-empty-state';
import { TransactionListUncategorizedPill } from '../transaction-list-uncategorized-pill/transaction-list-uncategorized-pill';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';

export const TransactionList = () => {
    const { activeFilters, setInternalFilters, hasFiltersSelected, sections, loadMore, isLoading } = useTransactionList(null);

    return (
        <View className="flex-1">
            <TransactionFilters
                filters={activeFilters}
                onChange={setInternalFilters}
                accountId={null}
                hasFiltersSelected={hasFiltersSelected}
            />

            <View className="flex-row items-center gap-x-md pt-2 pb-1">
                <TransactionListUncategorizedPill filters={activeFilters} />
                <TransactionListCount filters={activeFilters} className="ml-auto" />
            </View>

            <TransactionSectionsList
                sections={sections}
                onEndReached={loadMore}
                listEmptyState={<TransactionListEmptyState isLoading={isLoading} hasFiltersSelected={hasFiltersSelected} />}
            />
        </View>
    );
};
