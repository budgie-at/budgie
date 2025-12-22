import {
    DEFAULT_TRANSACTION_FILTER,
    TransactionAssociationEnum,
    TransactionFilterInterface,
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/components/empty-state/empty-state';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { createFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useGetInstrumentsMapQuery } from '../../../instrument/query/use-get-instruments-map.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useGetTransactionsQuery } from '../../query/use-get-transactions.query';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { TransactionCardPure, TransactionCardPureProps } from '../transaction-card/transaction-card';
import { TransactionFilters } from '../transaction-filters/transaction-filters';

type ListItem = { type: 'header'; title: string; id: string } | { type: 'transaction'; data: TransactionCardPureProps; id: string };

interface Props {
    readonly accountId: number | null;
}

const LIST_CONTENT_CONTAINER_STYLE = { gap: 16 };
const keyExtractor = (item: ListItem) => item.id;
const getItemType = (item: ListItem) => item.type;

const TransactionHeader = ({ title }: { title: string }) => (
    <View className="bg-primary-reverse py-sm">
        <Text className="text-secondary-foreground uppercase text-xs">{title}</Text>
    </View>
);

const renderItem = ({ item }: { item: ListItem }) =>
    item.type === 'header' ? (
        <TransactionHeader title={item.title} />
    ) : (
        <TransactionCardPure
            transaction={item.data.transaction}
            formattedAmount={item.data.formattedAmount}
            formattedDate={item.data.formattedDate}
            categoryLabel={item.data.categoryLabel}
        />
    );

const getCategoryLabel = (
    transaction: TransactionWithRelationsEntityInterface,
    balanceAdjustmentLabel: string,
    categoriesLabel: string
): string => {
    if (isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return balanceAdjustmentLabel;
    }

    if (transaction.entries.length > 1) {
        return categoriesLabel;
    }

    const [entry] = transaction.entries;

    return entry.category?.title ?? transaction.type;
};

export const TransactionList = ({ accountId }: Props) => {
    const [filters, setFilters] = useState<TransactionFilterInterface>({
        ...DEFAULT_TRANSACTION_FILTER,
        accountIds: isDefined(accountId) ? [accountId] : null
    });

    const hasFiltersSelected = checkIfFiltersSelected(accountId, filters);
    const { sections, loadMore } = useGetTransactionsQuery(filters);
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const { formatMonthAndDayWithTime } = useFormatDate();
    const { instrumentsMap } = useGetInstrumentsMapQuery();

    const balanceAdjustmentLabel = t`Balance Adjustment`;
    const categoriesLabel = t`Categories`;

    const flatData: ListItem[] = sections.flatMap(({ date, transactions }) => [
        { type: 'header' as const, title: date, id: `header-${date}` },
        ...transactions.map(transaction => {
            const { instrumentId } = transaction[TransactionAssociationEnum.ENTRIES][0];
            const instrument = instrumentsMap.get(instrumentId);
            const currencyCode = instrument?.code ?? defaultCurrency;
            const formatTransactionMoney = createFormatMoney(intl, decimalPlaces, currencyCode, true);

            return {
                type: 'transaction' as const,
                id: `transaction-${transaction.id}`,
                data: {
                    transaction,
                    formattedAmount: formatTransactionMoney(transaction.amount),
                    formattedDate: formatMonthAndDayWithTime(transaction.operatedAt),
                    categoryLabel: getCategoryLabel(transaction, balanceAdjustmentLabel, categoriesLabel)
                }
            };
        })
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
