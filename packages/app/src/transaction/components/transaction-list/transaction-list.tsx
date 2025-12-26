import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface } from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/components/empty-state/empty-state';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetTransactionsQuery } from '../../query/use-get-transactions.query';
import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { getTransactionCategoryLabel } from '../../utils/get-transaction-category-label.util';
import { TransactionCard } from '../transaction-card/transaction-card';
import { TransactionFilters } from '../transaction-filters/transaction-filters';

interface Props {
    readonly accountId: number | null;
}

const LIST_CONTENT_CONTAINER_STYLE = { gap: 16 };
const keyExtractor = (item: TransactionListItemType) => item.id;
const getItemType = (item: TransactionListItemType) => item.type;
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

const getStickyIndices = (sections: TransactionListItemType[]) =>
    sections.reduce<number[]>((headers, item, idx) => (item.type === 'header' ? [...headers, idx] : headers), []);

 
export const TransactionList = ({ accountId }: Props) => {
    const [filters, setFilters] = useState<TransactionFilterInterface>({
        ...DEFAULT_TRANSACTION_FILTER,
        accountIds: isDefined(accountId) ? [accountId] : null
    });

    const hasFiltersSelected = checkIfFiltersSelected(accountId, filters);
    const { sections, loadMore } = useGetTransactionsQuery(filters);
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
        <View className="gap-y-3xl flex-1">
            <TransactionFilters filters={filters} onChange={setFilters} accountId={accountId} hasFiltersSelected={hasFiltersSelected} />

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
                contentContainerStyle={LIST_CONTENT_CONTAINER_STYLE}
                ListEmptyComponent={listEmptyState}
                getItemType={getItemType}
            />
        </View>
    );
};
