import {
    DEFAULT_TRANSACTION_FILTER,
    TransactionFilterInterface,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { Page } from '../../../@generic/component/page/page';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { TransactionCard } from '../../../transaction/components/transaction-card/transaction-card';
import { TransactionsPageHeader } from '../../../transaction/components/transactions-page-header/transactions-page-header';
import { useGetTransactionsQuery } from '../../../transaction/query/use-get-transactions.query';
import { TransactionListItemType } from '../../../transaction/type/transaction-list-item.type';
import { getTransactionCategoryLabel } from '../../../transaction/utils/get-transaction-category-label.util';

const keyExtractor = (item: TransactionListItemType) => item.id;
const getItemType = (item: TransactionListItemType | undefined) => item?.type ?? '';
const getStickyIndices = (sections: (TransactionListItemType | undefined)[]) =>
    sections.reduce<number[]>((headers, item, idx) => (item?.type === 'header' ? [...headers, idx] : headers), []);

/* jscpd:ignore-start */
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
/* jscpd:ignore-end */

/* jscpd:ignore-start */
const transformToFlatData = (
    sections: Array<{ date: string; transactions: TransactionWithRelationsEntityInterface[] }>,
    formatMonthAndDayWithTime: (date: Date | string) => string,
    balanceAdjustmentLabel: string,
    categoriesLabel: string
): TransactionListItemType[] =>
    sections.flatMap(({ date, transactions }) => [
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
/* jscpd:ignore-end */

interface RouteParams {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    tagId?: string;
    type?: string;
    uncategorized?: string;
}

const buildCategoryIds = (params: RouteParams): number[] | null => {
    if (params.uncategorized === 'true') {
        return [];
    }

    if (isDefined(params.categoryId)) {
        return [Number(params.categoryId)];
    }

    return null;
};

const buildFilters = (params: RouteParams): TransactionFilterInterface => ({
    ...DEFAULT_TRANSACTION_FILTER,
    date: {
        from: isDefined(params.startDate) ? new Date(params.startDate) : null,
        to: isDefined(params.endDate) ? new Date(params.endDate) : null
    },
    categoryIds: buildCategoryIds(params),
    tagIds: isDefined(params.tagId) ? [Number(params.tagId)] : null,
    types: isDefined(params.type) ? [params.type as TransactionTypeEnum] : null
});

const buildEmptyState = (isLoading: boolean, t: (template: TemplateStringsArray) => string) =>
    isLoading ? (
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

export default function AnalyticsTransactionsPage() {
    const { t } = useLingui();
    const router = useRouter();
    const params = useLocalSearchParams() as RouteParams;
    const filters = buildFilters(params);

    const { category } = useGetCategoryByIdQuery(isDefined(params.categoryId) ? Number(params.categoryId) : 0);
    const { tags } = useGetTagByIdsQuery(isDefined(params.tagId) ? [Number(params.tagId)] : []);
    const { sections, loadMore, isLoading } = useGetTransactionsQuery(filters);
    const { formatMonthAndDayWithTime } = useFormatDate();

    const handleGoBack = () => void router.back();
    const flatData = transformToFlatData(sections, formatMonthAndDayWithTime, t`Balance Adjustment`, t`Categories`);
    const contentContainerStyle = { gap: 16, ...(flatData.length === 0 && { flexGrow: 1, justifyContent: 'center' as const }) };

    /* jscpd:ignore-start */

    return (
        <Page
            header={
                <TransactionsPageHeader
                    uncategorized={params.uncategorized}
                    category={category}
                    tag={tags?.[0]}
                    type={params.type}
                    startDate={params.startDate}
                    endDate={params.endDate}
                    onGoBack={handleGoBack}
                />
            }
        >
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
                ListEmptyComponent={buildEmptyState(isLoading, t)}
                getItemType={getItemType}
            />
        </Page>
    );
    /* jscpd:ignore-end */
}
