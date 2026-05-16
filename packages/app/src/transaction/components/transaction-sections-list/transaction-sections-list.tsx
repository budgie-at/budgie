import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useRouter } from 'expo-router';
import { ReactElement, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isEmptyArray } from '@rnw-community/shared';

import { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { resolveCategoryTitle } from '../../../category/utils/resolve-category-title.util';
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
    const { i18n } = useLingui();
    const [, hapticImpact] = useVibration();
    const { formatMonthAndDayWithTime } = useFormatDate();
    const { bottom } = useSafeAreaInsets();

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
        ...transactions.map(transaction => {
            const firstEntry = transaction.entries.at(0);
            const resolvedCategoryTitle = resolveCategoryTitle(firstEntry?.category, i18n);

            return {
                type: 'transaction' as const,
                id: `transaction-${transaction.id}`,
                data: {
                    transaction,
                    formattedDate: formatMonthAndDayWithTime(transaction.operatedAt),
                    categoryLabel: getTransactionCategoryLabel(transaction, balanceAdjustmentLabel, categoriesLabel, resolvedCategoryTitle)
                }
            };
        })
    ]);

    const isEmpty = isEmptyArray(flatData);
    const paddingBottom = (footerSpacerMultiplier ?? 0) * (FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN) + bottom;
    const contentContainerStyle = {
        gap: 16,
        paddingBottom,
        ...(isEmpty && { flexGrow: 1, justifyContent: 'center' as const })
    };

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
                    recycleItems
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={contentContainerStyle}
                    ListEmptyComponent={listEmptyState}
                    getItemType={getItemType}
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
