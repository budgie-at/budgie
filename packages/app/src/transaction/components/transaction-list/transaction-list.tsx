import {
    DateRangeInterface,
    DEFAULT_TRANSACTION_FILTER,
    TransactionFilterInterface,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import React, { useState } from 'react';
import { ScrollView, SectionList, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { DateFilter } from '../../../@generic/components/date-filter/date-filter';
import { EmptyState } from '../../../@generic/components/empty-state/empty-state';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useGetTransactionsQuery } from '../../query/use-get-transactions.query';
import { TransactionCard } from '../transaction-card/transaction-card';
// import { TransactionCategoryFilter } from '../transaction-category-filter/transaction-category-filter';
import { TransactionTypeFilter } from '../transaction-type-filter/transaction-type-filter';
import { TransactionTagFilter } from '../transaction-tag-filter/transaction-tag-filter';
import { TransactionCategoryFilter } from '../transaction-category-filter/transaction-category-filter';
import { TransactionAccountFilter } from '../transaction-account-filter/transaction-account-filter';

interface Props {
    readonly accountId: number | null;
}

export const TransactionList = ({ accountId }: Props) => {
    const [filters, setFilters] = useState<TransactionFilterInterface>({
        ...DEFAULT_TRANSACTION_FILTER,
        accountIds: isDefined(accountId) ? [accountId] : null
    });
    const hasFiltersSelected =
        JSON.stringify({ ...DEFAULT_TRANSACTION_FILTER, accountIds: isDefined(accountId) ? [accountId] : null }) !==
        JSON.stringify(filters);

    const { sections, loadMore } = useGetTransactionsQuery(filters);
    const { t } = useLingui();

    const listSections = sections.map(({ date, transactions }) => ({ title: date, data: transactions }));

    const renderItem = ({ item }: { item: TransactionWithRelationsEntityInterface }) => <TransactionCard transaction={item} />;
    const keyExtractor = (item: TransactionWithRelationsEntityInterface) => item.id.toString();

    const handleDateFilterChange = (range: DateRangeInterface | null) => void setFilters(prev => ({ ...prev, date: range }));
    const handleTypeFilterChange = (types: TransactionTypeEnum[] | null) => void setFilters(prev => ({ ...prev, types }));
    const handleAccountsFilterChange = (accountIds: number[] | null) => void setFilters(prev => ({ ...prev, accountIds }));
    const handleTagsFilterChange = (tagIds: number[] | null) => void setFilters(prev => ({ ...prev, tagIds }));
    const handleCategoriesFilterChange = (categoryIds: number[] | null) => void setFilters(prev => ({ ...prev, categoryIds }));

    const handleResetFilters = () =>
        void setFilters({ ...DEFAULT_TRANSACTION_FILTER, accountIds: isDefined(accountId) ? [accountId] : null });

    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <View className="bg-primary-reverse">
            <Text className="text-secondary-foreground uppercase text-xs">{section.title}</Text>
        </View>
    );

    const listEmptyState = (
        <EmptyState
            circleIcon="Receipt"
            title={hasFiltersSelected ? t`No matching transactions` : t`No transactions yet`}
            titleClassName="text-md text-primary font-semibold"
            description={
                hasFiltersSelected
                    ? t`Try adjusting your filters to see more results`
                    : t`Start tracking your spending by using the mic button or adding transactions manually`
            }
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    return (
        <>
            <View className="-mx-7xl">
                <ScrollView
                    horizontal
                    contentContainerClassName="flex-row items-center gap-x-md px-7xl"
                    showsHorizontalScrollIndicator={false}
                >
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
                    <TransactionTypeFilter value={filters.types} onChange={handleTypeFilterChange} />
                    <TransactionCategoryFilter value={filters.categoryIds} onChange={handleCategoriesFilterChange} />
                    <TransactionTagFilter value={filters.tagIds} onChange={handleTagsFilterChange} />
                    {isDefined(accountId) ? null : (
                        <TransactionAccountFilter value={filters.accountIds} onChange={handleAccountsFilterChange} />
                    )}
                </ScrollView>
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
