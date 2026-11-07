import { View } from 'react-native';

import { StaticChromeLegendList } from '../../../@generic/component/static-chrome-legend-list/static-chrome-legend-list';
import { useTransactionList } from '../../hook/use-transaction-list.hook';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionListCount } from '../transaction-list-count/transaction-list-count';
import { TransactionListEmptyState } from '../transaction-list-empty-state/transaction-list-empty-state';
import { TransactionListUncategorizedPill } from '../transaction-list-uncategorized-pill/transaction-list-uncategorized-pill';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';

export const TransactionList = () => {
    const { activeFilters, setInternalFilters, clearFilters, hasFiltersSelected, isClearAllVisible, sections, loadMore, isLoading } =
        useTransactionList(null);

    const listHeader = (
        <View className="pb-md">
            <TransactionFilters
                filters={activeFilters}
                onChange={setInternalFilters}
                scopeAccountIds={null}
                isClearAllVisible={isClearAllVisible}
                leading={<TransactionListUncategorizedPill filters={activeFilters} />}
            />
        </View>
    );

    return (
        <View className="flex-1">
            <TransactionListCount filters={activeFilters}>
                <TransactionSectionsList
                    listHeader={listHeader}
                    listComponent={StaticChromeLegendList}
                    sections={sections}
                    onEndReached={loadMore}
                    accountIds={activeFilters.accountIds}
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
