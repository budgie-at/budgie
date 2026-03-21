import { LegendList } from '@legendapp/list';
import { ReactElement } from 'react';
import { Text, View } from 'react-native';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionsByMonthSection } from '../../interface/transactions-by-month-section.interface';
import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { getTransactionCategoryLabel } from '../../utils/get-transaction-category-label.util';
import { TransactionContextMenuCard } from '../transaction-context-menu-card/transaction-context-menu-card';

interface Props {
    readonly sections: TransactionsByMonthSection[];
    readonly onEndReached: () => void;
    readonly listEmptyState: ReactElement;
    readonly balanceAdjustmentLabel: string;
    readonly categoriesLabel: string;
    readonly footerSpacerMultiplier?: number;
    readonly focusKey?: number;
}

const keyExtractor = (item: TransactionListItemType) => item.id;
const getItemType = (item: TransactionListItemType | undefined) => item?.type ?? '';

const renderItem = ({ item }: { item: TransactionListItemType }) =>
    item.type === 'header' ? (
        <View className="bg-primary-reverse py-sm">
            <Text className="text-secondary-foreground uppercase text-xs">{item.title}</Text>
        </View>
    ) : (
        <TransactionContextMenuCard
            transaction={item.data.transaction}
            formattedDate={item.data.formattedDate}
            categoryLabel={item.data.categoryLabel}
        />
    );

const getStickyIndices = (sections: (TransactionListItemType | undefined)[]) =>
    sections.reduce<number[]>((headers, item, idx) => (item?.type === 'header' ? [...headers, idx] : headers), []);

export const TransactionSectionsList = ({
    sections,
    onEndReached,
    listEmptyState,
    balanceAdjustmentLabel,
    categoriesLabel,
    footerSpacerMultiplier,
    focusKey
}: Props) => {
    const { formatMonthAndDayWithTime } = useFormatDate();

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

    const listFooter = <MenuSpacer multiplier={footerSpacerMultiplier} />;

    return (
        <LegendList
            key={focusKey}
            data={flatData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            estimatedItemSize={80}
            stickyIndices={getStickyIndices(flatData)}
            recycleItems
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentContainerStyle}
            ListEmptyComponent={listEmptyState}
            getItemType={getItemType}
            ListFooterComponent={listFooter}
        />
    );
};
