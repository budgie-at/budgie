import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionCard } from '../../../transaction/components/transaction-card/transaction-card';
import { useGetTransactionsQuery } from '../../../transaction/query/use-get-transactions.query';
import { TransactionListItemType } from '../../../transaction/type/transaction-list-item.type';
import { getTransactionCategoryLabel } from '../../../transaction/utils/get-transaction-category-label.util';

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

export default function AnalyticsTransactionsPage() {
    const { t } = useLingui();
    const { startDate, endDate, categoryId, tagId, type } = useLocalSearchParams<{
        startDate?: string;
        endDate?: string;
        categoryId?: string;
        tagId?: string;
        type?: string;
    }>();

    const filters: TransactionFilterInterface = useMemo(
        () => ({
            ...DEFAULT_TRANSACTION_FILTER,
            date: {
                from: isDefined(startDate) ? new Date(startDate) : null,
                to: isDefined(endDate) ? new Date(endDate) : null
            },
            categoryIds: isDefined(categoryId) ? [Number(categoryId)] : null,
            tagIds: isDefined(tagId) ? [Number(tagId)] : null,
            types: isDefined(type) ? [type as TransactionTypeEnum] : null
        }),
        [startDate, endDate, categoryId, tagId, type]
    );

    const { sections, loadMore, isLoading } = useGetTransactionsQuery(filters);
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

    const isEmpty = flatData.length === 0;
    const contentContainerStyle = { gap: 16, ...(isEmpty && { flexGrow: 1, justifyContent: 'center' as const }) };

    const listEmptyState = isLoading ? (
        <ActivityIndicator size="large" />
    ) : (
        <EmptyState
            circleIcon={UserIconNameEnum.Receipt}
            title={t`No transactions found`}
            titleClassName="text-md text-primary font-semibold"
            description={t`No transactions match the selected criteria`}
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    return (
        <Page header={<PageHeader className="border-b-0" size="md" title={t`Transactions`} />}>
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
        </Page>
    );
}
