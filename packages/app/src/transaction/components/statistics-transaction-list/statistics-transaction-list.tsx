/* jscpd:ignore-start */
import { StatisticsFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetStatisticsTransactionsQuery } from '../../query/use-get-statistics-transactions.query';
import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { getTransactionCategoryLabel } from '../../utils/get-transaction-category-label.util';
import { TransactionCard } from '../transaction-card/transaction-card';

interface Props {
    readonly filters: StatisticsFilterInterface;
}

const keyExtractor = (item: TransactionListItemType) => item.id;
const getItemType = (item: TransactionListItemType | undefined) => item?.type ?? '';

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

export const StatisticsTransactionList = ({ filters }: Props) => {
    const { sections, loadMore, isLoading } = useGetStatisticsTransactionsQuery(filters);
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

    const listEmptyState = isLoading ? (
        <ActivityIndicator size="large" />
    ) : (
        <EmptyState
            circleIcon={UserIconNameEnum.Receipt}
            title={t`No matching transactions`}
            titleClassName="text-md text-primary font-semibold"
            description={t`Try adjusting your filters to see more results`}
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    const isEmpty = flatData.length === 0;
    const contentContainerStyle = { gap: 16, ...(isEmpty && { flexGrow: 1, justifyContent: 'center' as const }) };

    return (
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
    );
};
/* jscpd:ignore-end */
