import { View } from 'react-native';

import { useTransactionList } from '../../hook/use-transaction-list.hook';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionListCount } from '../transaction-list-count/transaction-list-count';
import { TransactionListEmptyState } from '../transaction-list-empty-state/transaction-list-empty-state';
import { TransactionListUncategorizedPill } from '../transaction-list-uncategorized-pill/transaction-list-uncategorized-pill';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';

export const TransactionList = () => {
    const { activeFilters, setInternalFilters, clearFilters, hasFiltersSelected, sections, loadMore, isLoading } = useTransactionList(null);

    return (
        <View className="flex-1">
            <TransactionFilters
                filters={activeFilters}
                onChange={setInternalFilters}
                accountId={null}
                hasFiltersSelected={hasFiltersSelected}
                leading={<TransactionListUncategorizedPill filters={activeFilters} />}
            />

            <TransactionListCount filters={activeFilters}>
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
                />
            </TransactionListCount>
        </View>
    );
};
