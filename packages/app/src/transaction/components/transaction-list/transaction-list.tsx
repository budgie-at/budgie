import {
    DateFilterInterface,
    DEFAULT_TRANSACTION_FILTER,
    TransactionFilterInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import React, { useState } from 'react';
import { SectionList, Text, View } from 'react-native';

import { DateFilter } from '../../../@generic/components/date-filter/date-filter';
import { EmptyState } from '../../../@generic/components/empty-state/empty-state';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useGetTransactionsQuery } from '../../query/use-get-transactions.query';
import { TransactionCard } from '../transaction-card/transaction-card';

interface Props {
    readonly accountId: number | null;
}

export const TransactionList = ({ accountId }: Props) => {
    const [filters, setFilters] = useState<TransactionFilterInterface>({ ...DEFAULT_TRANSACTION_FILTER, accountId });
    const hasFiltersSelected = JSON.stringify({ ...DEFAULT_TRANSACTION_FILTER, accountId }) !== JSON.stringify(filters);

    const { sections, loadMore } = useGetTransactionsQuery(filters);
    const { t } = useLingui();

    const listSections = sections.map(({ date, transactions }) => ({ title: date, data: transactions }));

    const renderItem = ({ item }: { item: TransactionWithRelationsEntityInterface }) => <TransactionCard transaction={item} />;
    const keyExtractor = (item: TransactionWithRelationsEntityInterface) => item.id.toString();

    const handleDateFilterChange = (dateFilter: DateFilterInterface | null) => void setFilters(prev => ({ ...prev, date: dateFilter }));

    const handleResetFilters = () => setFilters({ ...DEFAULT_TRANSACTION_FILTER, accountId });

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
            <View className="flex-row items-center gap-x-md">
                {hasFiltersSelected ? (
                    <HapticPressable
                        onPress={handleResetFilters}
                        className="bg-destructive-background border border-destructive-corner rounded-2xl px-xl py-sm flex-row items-center gap-x-xs"
                    >
                        <Icon icon={ICONS.X} className="text-destructive-foreground" size={14} />
                        <Text className="text-destructive-foreground text-sm">
                            <Trans>Clear All</Trans>
                        </Text>
                    </HapticPressable>
                ) : null}

                <DateFilter value={filters.date} onChange={handleDateFilterChange} />
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
