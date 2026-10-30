import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useRouter } from 'expo-router';
import { ComponentType, ReactElement, RefCallback, useEffect, useEffectEvent, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../../@generic/constant/floating-tab-bar.constant';
import { LegendListPositionSourceInterface } from '../../../@generic/interface/legend-list-position-source.interface';
import { TransactionListItemKindEnum } from '../../enum/transaction-list-item-kind.enum';
import { TransactionListContextMenuRefInterface } from '../../interface/transaction-list-context-menu-ref.interface';
import { TransactionsByDaySectionInterface } from '../../interface/transactions-by-day-section.interface';
import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { buildTransactionListItems } from '../../utils/build-transaction-list-items.util';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionCard } from '../transaction-card/transaction-card';
import { TransactionListContextMenu } from '../transaction-list-context-menu/transaction-list-context-menu';
import { TransactionSectionHeader } from '../transaction-section-header/transaction-section-header';

import type { LegendListProps } from '@legendapp/list/react-native';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly sections: TransactionsByDaySectionInterface[];
    readonly onEndReached: () => void;
    readonly listEmptyState: ReactElement;
    readonly accountId?: number | null;
    readonly footerSpacerMultiplier?: number;
    readonly listHeader?: ReactElement;
    readonly listComponent?: ComponentType<
        LegendListProps<TransactionListItemType> & { readonly ref?: RefCallback<LegendListPositionSourceInterface> }
    >;
    readonly headerOffsets?: SharedValue<number[]>;
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
    headerOffsets
}: Props) => {
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();

    const menuRef = useRef<TransactionListContextMenuRefInterface>(null);
    const listRef = useRef<LegendListPositionSourceInterface | null>(null);

    const handlePress = (transaction: TransactionWithRelationsEntityInterface) => {
        router.push(getTransactionHref(transaction));
    };

    const handleLongPress = (transaction: TransactionWithRelationsEntityInterface, anchor: PopoverMenuAnchor) => {
        menuRef.current?.open(transaction, anchor);
    };

    const renderItem = ({ item }: { item: TransactionListItemType }) =>
        item.type === TransactionListItemKindEnum.HEADER ? (
            <View className="bg-surface">
                <TransactionSectionHeader title={item.title} netAmount={item.netAmount} />
            </View>
        ) : (
            <TransactionCard
                transaction={item.transaction}
                position={item.position}
                accountId={accountId}
                onPress={handlePress}
                onLongPress={handleLongPress}
            />
        );

    const { items: flatData, headerIndices } = buildTransactionListItems(sections);
    const stickyHeaderIndices = isDefined(headerOffsets) ? [] : headerIndices;

    const handleListRef = (list: LegendListPositionSourceInterface | null) => {
        listRef.current = list;
    };

    const publishHeaderOffsets = () => {
        const state = listRef.current?.getState();

        if (isDefined(state)) {
            headerOffsets?.set(headerIndices.map(index => state.positionAtIndex(index)));
        }
    };

    const handleSectionsChange = useEffectEvent(publishHeaderOffsets);

    const contentContainerStyle = {
        paddingBottom: footerSpacerMultiplier * (FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN) + bottom,
        ...(isEmptyArray(flatData) && { flexGrow: 1, paddingBottom: bottom }),
        ...(isEmptyArray(flatData) && !isDefined(listHeader) && { justifyContent: 'center' as const })
    };

    useEffect(() => void handleSectionsChange(), [sections]);

    return (
        <>
            <View className="flex-1">
                <ListComponent
                    style={LIST_STYLE}
                    data={flatData}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    estimatedItemSize={64}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={contentContainerStyle}
                    ListHeaderComponent={listHeader}
                    ListEmptyComponent={listEmptyState}
                    getItemType={getItemType}
                    onItemSizeChanged={publishHeaderOffsets}
                    onViewableItemsChanged={publishHeaderOffsets}
                    ref={handleListRef}
                    stickyHeaderIndices={stickyHeaderIndices}
                />
            </View>
            <TransactionListContextMenu ref={menuRef} />
        </>
    );
};
