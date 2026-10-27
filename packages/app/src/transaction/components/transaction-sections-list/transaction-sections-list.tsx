import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ComponentType, ReactElement, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { StickySectionHeaderBackdrop } from '../../../@generic/component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionListItemKindEnum } from '../../enum/transaction-list-item-kind.enum';
import { TransactionMenuStateInterface } from '../../interface/transaction-menu-state.interface';
import { TransactionsByMonthSection } from '../../interface/transactions-by-month-section.type';
import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { getTransactionCategoryLabel } from '../../utils/get-transaction-category-label.util';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionCard } from '../transaction-card/transaction-card';
import { TransactionListContextMenu } from '../transaction-list-context-menu/transaction-list-context-menu';

import type { LegendListProps } from '@legendapp/list/react-native';

interface Props {
    readonly sections: TransactionsByMonthSection[];
    readonly onEndReached: () => void;
    readonly listEmptyState: ReactElement;
    readonly accountId?: number | null;
    readonly footerSpacerMultiplier?: number;
    readonly listHeader?: ReactElement;
    readonly listComponent?: ComponentType<LegendListProps<TransactionListItemType>>;
}

const keyExtractor = (item: TransactionListItemType) => item.id;

const getItemType = (item: TransactionListItemType) => item.type;

const LIST_STYLE = { flex: 1 };

// eslint-disable-next-line max-statements, max-lines-per-function -- List orchestration component with context menu state management
export const TransactionSectionsList = ({
    sections,
    onEndReached,
    listEmptyState,
    accountId = null,
    footerSpacerMultiplier = 1,
    listHeader,
    listComponent: ListComponent = BudgieLegendList
}: Props) => {
    const router = useRouter();
    const { t } = useLingui();
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
        item.type === TransactionListItemKindEnum.HEADER ? (
            <View className="py-sm">
                <StickySectionHeaderBackdrop />
                <Text className="text-secondary-foreground uppercase text-xs">{item.title}</Text>
            </View>
        ) : (
            <TransactionCard
                transaction={item.data.transaction}
                formattedDate={item.data.formattedDate}
                categoryLabel={item.data.categoryLabel}
                accountId={item.data.accountId}
                onPress={handlePress}
                onLongPress={handleLongPress}
            />
        );

    const stickyHeaderIndices: number[] = [];
    const flatData: TransactionListItemType[] = [];

    for (const { date, transactions } of sections) {
        stickyHeaderIndices.push(flatData.length);
        flatData.push(
            { type: TransactionListItemKindEnum.HEADER, title: date, id: `header-${date}` },
            ...transactions.map(transaction => ({
                type: TransactionListItemKindEnum.TRANSACTION as const,
                id: `transaction-${transaction.id}`,
                data: {
                    transaction,
                    formattedDate: formatMonthAndDayWithTime(transaction.operatedAt),
                    accountId,
                    categoryLabel: getTransactionCategoryLabel(transaction, t`Balance Adjustment`, t`Categories`)
                }
            }))
        );
    }

    const isEmpty = isEmptyArray(flatData);
    const paddingBottom = footerSpacerMultiplier * (FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN) + bottom;
    const contentContainerStyle = {
        gap: 16,
        paddingBottom,
        ...(isEmpty && !isDefined(listHeader) && { flexGrow: 1, justifyContent: 'center' as const })
    };

    return (
        <>
            <View className="flex-1">
                <ListComponent
                    style={LIST_STYLE}
                    data={flatData}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    estimatedItemSize={150}
                    stickyHeaderIndices={stickyHeaderIndices}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={contentContainerStyle}
                    ListHeaderComponent={listHeader}
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
