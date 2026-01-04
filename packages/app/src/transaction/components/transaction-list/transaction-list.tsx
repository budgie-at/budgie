import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetTransactionsQuery } from '../../query/use-get-transactions.query';
import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { getTransactionCategoryLabel } from '../../utils/get-transaction-category-label.util';
import { TransactionCard } from '../transaction-card/transaction-card';
import { TransactionFilters } from '../transaction-filters/transaction-filters';

interface Props {
    readonly accountId?: number | null;
    readonly filters?: TransactionFilterInterface;
    readonly showFilters?: boolean;
}

const keyExtractor = (item: TransactionListItemType) => item.id;
const getItemType = (item: TransactionListItemType | undefined) => item?.type ?? '';
// HINT: You cannot extract this into component or you will get a warning about hook usage
const renderItem = ({ item }: { item: TransactionListItemType }) =>
    item.type === 'header' ? (
        <View className="bg-primary-reverse py-sm">
            <Text className="text-secondary-foreground uppercase text-xs">{item.title}</Text>
        </View>
    ) : (
        <TransactionCard
            transaction={item.data.transaction}
            formattedDate={item.data.formattedDate}
            categoryLabel={item.data.categoryLabel}
        />
    );

const getStickyIndices = (sections: (TransactionListItemType | undefined)[]) =>
    sections.reduce<number[]>((headers, item, idx) => (item?.type === 'header' ? [...headers, idx] : headers), []);

// eslint-disable-next-line max-statements
export const TransactionList = ({ accountId = null, filters: externalFilters, showFilters = true }: Props) => {
    const [internalFilters, setInternalFilters] = useState<TransactionFilterInterface>({
        ...DEFAULT_TRANSACTION_FILTER,
        accountIds: isDefined(accountId) ? [accountId] : null
    });

    const activeFilters = externalFilters ?? internalFilters;
    const hasFiltersSelected = checkIfFiltersSelected(accountId, activeFilters);
    const { sections, loadMore, isLoading } = useGetTransactionsQuery(activeFilters);
    const { t } = useLingui();
    const { formatMonthAndDayWithTime } = useFormatDate();

    const balanceAdjustmentLabel = t`Balance Adjustment`;
    const categoriesLabel = t`Categories`;

    const flatData: TransactionListItemType[] = sections.flatMap(({ date, transactions }) => [
        { type: 'header' as const, title: date, id: `header-${date}` },
        ...transactions.map(transaction => ({
            type: 'transaction' as const,
            id: `transaction-${transaction.id}`,
            data: {
                transaction,
                formattedDate: formatMonthAndDayWithTime(transaction.operatedAt),
                categoryLabel: getTransactionCategoryLabel(transaction, balanceAdjustmentLabel, categoriesLabel)
            }
        }))
    ]);

    const emptyTitle = hasFiltersSelected ? t`No matching transactions` : t`No transactions yet`;
    const emptyDescription = hasFiltersSelected
        ? t`Try adjusting your filters to see more results`
        : t`Start tracking your spending by using the mic button or adding transactions manually`;

    const listEmptyState = isLoading ? (
        <ActivityIndicator size="large" />
    ) : (
        <EmptyState
            circleIcon={UserIconNameEnum.Receipt}
            title={emptyTitle}
            titleClassName="text-md text-primary font-semibold"
            description={emptyDescription}
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    const isEmpty = flatData.length === 0;
    const contentContainerStyle = { gap: 16, ...(isEmpty && { flexGrow: 1, justifyContent: 'center' as const }) };

    const canShowFilters = showFilters && !externalFilters;

    return (
        <View className="gap-y-3xl flex-1">
            {canShowFilters && (
                <TransactionFilters
                    filters={activeFilters}
                    onChange={setInternalFilters}
                    accountId={accountId}
                    hasFiltersSelected={hasFiltersSelected}
                />
            )}

            <LegendList
                data={flatData}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                estimatedItemSize={80}
                stickyIndices={getStickyIndices(flatData)}
                recycleItems
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={contentContainerStyle}
                ListEmptyComponent={listEmptyState}
                getItemType={getItemType}
            />
        </View>
    );
};
