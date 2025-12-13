import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import React, { useState } from 'react';
import { SectionList, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/components/empty-state/empty-state';
import { useGetTransactionsQuery } from '../../query/use-get-transactions.query';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { TransactionCard } from '../transaction-card/transaction-card';
import { TransactionListFilters } from '../transaction-list-filters/transaction-list-filters';

interface Props {
    readonly accountId: number | null;
}

export const TransactionList = ({ accountId }: Props) => {
    const [filters, setFilters] = useState<TransactionFilterInterface>({
        ...DEFAULT_TRANSACTION_FILTER,
        accountIds: isDefined(accountId) ? [accountId] : null
    });

    const hasFiltersSelected = checkIfFiltersSelected(accountId, filters);

    const { sections, loadMore } = useGetTransactionsQuery(filters);
    const { t } = useLingui();

    const listSections = sections.map(({ date, transactions }) => ({ title: date, data: transactions }));

    const renderItem = ({ item }: { item: TransactionWithRelationsEntityInterface }) => <TransactionCard transaction={item} />;
    const keyExtractor = (item: TransactionWithRelationsEntityInterface) => item.id.toString();

    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <View className="bg-primary-reverse py-sm">
            <Text className="text-secondary-foreground uppercase text-xs">{section.title}</Text>
        </View>
    );

    const emptyTitle = hasFiltersSelected ? t`No matching transactions` : t`No transactions yet`;
    const emptyDescription = hasFiltersSelected
        ? t`Try adjusting your filters to see more results`
        : t`Start tracking your spending by using the mic button or adding transactions manually`;

    const listEmptyState = (
        <EmptyState
            circleIcon="Receipt"
            title={emptyTitle}
            titleClassName="text-md text-primary font-semibold"
            description={emptyDescription}
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    return (
        <View className="gap-y-3xl">
            <TransactionListFilters filters={filters} onChange={setFilters} accountId={accountId} hasFiltersSelected={hasFiltersSelected} />

            <SectionList
                showsVerticalScrollIndicator={false}
                contentContainerClassName="gap-y-xl"
                sections={listSections}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                stickySectionHeadersEnabled
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                ListEmptyComponent={listEmptyState}
            />
        </View>
    );
};
