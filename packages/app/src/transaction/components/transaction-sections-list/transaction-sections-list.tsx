import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useRouter } from 'expo-router';
import { ReactElement, useState } from 'react';
import { Text, View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TRANSACTION_LIST_ESTIMATED_ITEM_SIZE } from '../../constant/transaction-list.constant';
import { TransactionMenuStateInterface } from '../../interface/transaction-menu-state.interface';
import { TransactionsByMonthSection } from '../../interface/transactions-by-month-section.type';
import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { getTransactionCategoryLabel } from '../../utils/get-transaction-category-label.util';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionCard } from '../transaction-card/transaction-card';
import { TransactionListContextMenu } from '../transaction-list-context-menu/transaction-list-context-menu';

interface Props {
    readonly sections: TransactionsByMonthSection[];
    readonly onEndReached: () => void;
    readonly listEmptyState: ReactElement;
    readonly balanceAdjustmentLabel: string;
    readonly categoriesLabel: string;
    readonly footerSpacerMultiplier?: number;
}

const keyExtractor = (item: TransactionListItemType) => item.id;
const getItemType = (item: TransactionListItemType | undefined) => item?.type ?? '';

const getStickyIndices = (sections: (TransactionListItemType | undefined)[]) =>
    sections.reduce<number[]>((headers, item, idx) => (item?.type === 'header' ? [...headers, idx] : headers), []);

const LIST_STYLE = { flex: 1 };

// eslint-disable-next-line max-statements, max-lines-per-function -- List orchestration component with context menu state management
export const TransactionSectionsList = ({
    sections,
    onEndReached,
    listEmptyState,
    balanceAdjustmentLabel,
    categoriesLabel,
    footerSpacerMultiplier
}: Props) => {
    const router = useRouter();
    const [, hapticImpact] = useVibration();
    const { formatMonthAndDayWithTime } = useFormatDate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuState, setMenuState] = useState<TransactionMenuStateInterface | null>(null);

    const handlePress = (transaction: TransactionWithRelationsEntityInterface) => {
        router.push(getTransactionHref(transaction));
    };

    const handleLongPress = (transaction: TransactionWithRelationsEntityInterface, anchor: PopoverMenuAnchor) => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        setMenuState({ transaction, anchor });
        setIsMenuOpen(true);
    };

    const handleMenuClose = () => {
        setIsMenuOpen(false);
    };

    const handleMenuCloseComplete = () => {
        setMenuState(null);
    };

    const menuTransaction = menuState?.transaction ?? null;

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
                onPress={handlePress}
                onLongPress={handleLongPress}
            />
        );

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

    const isEmpty = isEmptyArray(flatData);
    const contentContainerStyle = { gap: 16, ...(isEmpty && { flexGrow: 1, justifyContent: 'center' as const }) };

    const listFooter = <MenuSpacer multiplier={footerSpacerMultiplier} />;

    return (
        <>
            <View className="flex-1">
                <LegendList
                    style={LIST_STYLE}
                    data={flatData}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    estimatedItemSize={TRANSACTION_LIST_ESTIMATED_ITEM_SIZE}
                    stickyIndices={getStickyIndices(flatData)}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={contentContainerStyle}
                    ListEmptyComponent={listEmptyState}
                    getItemType={getItemType}
                    ListFooterComponent={listFooter}
                />
            </View>
            <TransactionListContextMenu
                transaction={menuTransaction}
                isOpen={isMenuOpen}
                onClose={handleMenuClose}
                onCloseComplete={handleMenuCloseComplete}
                anchor={menuState?.anchor}
            />
        </>
    );
};
