import {
    DatePeriodEnum,
    TransactionFilterInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import React, { useState } from 'react';
import { SectionList, Text, View } from 'react-native';

import { EmptyState } from '../../../@generic/components/empty-state/empty-state';
import { useGetTransactionsQuery } from '../../query/use-get-transactions.query';
import { TransactionCard } from '../transaction-card/transaction-card';
import { TransactionFilterSelector } from '../transaction-filter-selector/transaction-filter-selector';

interface Props {
    readonly accountId: number | null;
}

export const TransactionList = ({ accountId }: Props) => {
    const [filters, setFilters] = useState<TransactionFilterInterface>({ accountId, period: DatePeriodEnum.ALL_TIME, type: null });

    const { sections, loadMore, totalCount } = useGetTransactionsQuery(filters);
    const { t } = useLingui();

    const listSections = sections.map(({ date, transactions }) => ({ title: date, data: transactions }));

    const renderItem = ({ item }: { item: TransactionWithRelationsEntityInterface }) => <TransactionCard transaction={item} />;
    const keyExtractor = (item: TransactionWithRelationsEntityInterface) => item.id.toString();

    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <View className="bg-primary-reverse">
            <Text className="text-secondary-foreground uppercase text-xs">{section.title}</Text>
        </View>
    );

    const listEmptyState = (
        <EmptyState
            circleIcon="Receipt"
            title={t`No transactions yet`}
            titleClassName="text-md text-primary font-semibold"
            description={t`Start tracking your spending by using the mic button or adding transactions manually`}
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    return (
        <>
            <View className="flex-row justify-between items-center">
                <Text className="text-secondary-foreground text-sm font-medium">
                    <Trans>{totalCount} Transactions</Trans>
                </Text>

                <TransactionFilterSelector selectedFilters={filters} onFiltersChange={setFilters} />
            </View>

            <SectionList
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pt-5xl gap-y-xl"
                sections={listSections}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                stickySectionHeadersEnabled
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                ListEmptyComponent={listEmptyState}
            />
        </>
    );
};
