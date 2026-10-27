import { View } from 'react-native';

import { useTransactionList } from '../../hook/use-transaction-list.hook';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionListEmptyState } from '../transaction-list-empty-state/transaction-list-empty-state';
import { TransactionListMeta } from '../transaction-list-meta/transaction-list-meta';
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

            <TransactionListMeta filters={activeFilters} />

            <TransactionSectionsList
                sections={sections}
                onEndReached={loadMore}
                listEmptyState={<TransactionListEmptyState isLoading={isLoading} hasFiltersSelected={hasFiltersSelected} />}
            />
        </View>
    );
};
