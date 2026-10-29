import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useRouter } from 'expo-router';
import { ComponentType, ReactElement, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { TransactionListItemKindEnum } from '../../enum/transaction-list-item-kind.enum';
import { TransactionListContextMenuRefInterface } from '../../interface/transaction-list-context-menu-ref.interface';
import { TransactionsByDaySectionInterface } from '../../interface/transactions-by-day-section.interface';
import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { getTransactionListRowPosition } from '../../utils/get-transaction-list-row-position.util';
import { TransactionCard } from '../transaction-card/transaction-card';
import { TransactionListContextMenu } from '../transaction-list-context-menu/transaction-list-context-menu';
import { TransactionSectionHeader } from '../transaction-section-header/transaction-section-header';
// from '../transaction-list-context-menu/transaction-list-context-menu';

import type { LegendListProps } from '@legendapp/list/react-native';

interface Props {
    readonly sections: TransactionsByDaySectionInterface[];
    readonly onEndReached: () => void;
    readonly listEmptyState: ReactElement;
    readonly accountId?: number | null;
    readonly footerSpacerMultiplier?: number;
    readonly listHeader?: ReactElement;
    readonly listComponent?: ComponentType<LegendListProps<TransactionListItemType>>;
    readonly stickyHeaderOffset?: number;
}

const keyExtractor = (item: TransactionListItemType) => item.id;

const getItemType = (item: TransactionListItemType) => item.type;

const LIST_STYLE = { flex: 1 };

export const TransactionSectionsList = ({
    sections,
    onEndReached,
    listEmptyState,
    accountId = null,
    footerSpacerMultiplier = 1,
    listHeader,
    listComponent: ListComponent = BudgieLegendList,
    stickyHeaderOffset
}: Props) => {
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();

    const menuRef = useRef<TransactionListContextMenuRefInterface>(null);

    const handlePress = (transaction: TransactionWithRelationsEntityInterface) => {
        router.push(getTransactionHref(transaction));
    };

    const handleLongPress = (transaction: TransactionWithRelationsEntityInterface, anchor: PopoverMenuAnchor) => {
        menuRef.current?.open(transaction, anchor);
    };

    const renderItem = ({ item }: { item: TransactionListItemType }) =>
        item.type === TransactionListItemKindEnum.HEADER ? (
            <TransactionSectionHeader title={item.title} />
        ) : (
            <TransactionCard
                transaction={item.transaction}
                position={item.position}
                accountId={accountId}
                onPress={handlePress}
                onLongPress={handleLongPress}
            />
        );

    const stickyHeaderIndices: number[] = [];
    const flatData: TransactionListItemType[] = [];

    for (const { title, transactions } of sections) {
        stickyHeaderIndices.push(flatData.length);
        flatData.push(
            { type: TransactionListItemKindEnum.HEADER, title, id: `header-${title}` },
            ...transactions.map((transaction, index) => ({
                type: TransactionListItemKindEnum.TRANSACTION as const,
                id: `transaction-${transaction.id}`,
                position: getTransactionListRowPosition(index, transactions.length),
                transaction
            }))
        );
    }

    const paddingBottom = footerSpacerMultiplier * (FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN) + bottom;
    const contentContainerStyle = {
        paddingBottom,
        ...(isEmptyArray(flatData) && { flexGrow: 1 }),
        ...(isEmptyArray(flatData) && !isDefined(listHeader) && { justifyContent: 'center' as const })
    };

    const stickyHeaderProps = isDefined(stickyHeaderOffset) ? { stickyHeaderConfig: { offset: stickyHeaderOffset } } : {};

    return (
        <>
            <View className="flex-1">
                <ListComponent
                    style={LIST_STYLE}
                    data={flatData}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    estimatedItemSize={64}
                    stickyHeaderIndices={stickyHeaderIndices}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={contentContainerStyle}
                    ListHeaderComponent={listHeader}
                    ListEmptyComponent={listEmptyState}
                    getItemType={getItemType}
                    {...stickyHeaderProps}
                />
            </View>
            <TransactionListContextMenu ref={menuRef} />
        </>
    );
};
