import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useRouter } from 'expo-router';
import { ComponentType, ReactElement, RefCallback, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import {
    FLOATING_TAB_BAR_HEIGHT,
    FLOATING_TAB_BAR_MARGIN,
    FLOATING_TAB_BAR_MIN_BOTTOM_INSET
} from '../../../@generic/constant/floating-tab-bar.constant';
import { LegendListPositionSourceInterface } from '../../../@generic/interface/legend-list-position-source.interface';
import { TransactionListItemKindEnum } from '../../enum/transaction-list-item-kind.enum';
import { useTransactionListHeaderOffsets } from '../../hook/use-transaction-list-header-offsets.hook';
import { TransactionListContextMenuRefInterface } from '../../interface/transaction-list-context-menu-ref.interface';
import { TransactionsByDaySectionInterface } from '../../interface/transactions-by-day-section.interface';
import { TransactionListItemType } from '../../type/transaction-list-item.type';
import { buildTransactionListItems } from '../../utils/build-transaction-list-items.util';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { getTransactionRowAccountId } from '../../utils/get-transaction-row-account-id.util';
import { TransactionCard } from '../transaction-card/transaction-card';
import { TransactionListContextMenu } from '../transaction-list-context-menu/transaction-list-context-menu';
import { TransactionSectionHeader } from '../transaction-section-header/transaction-section-header';

import type { LegendListProps } from '@legendapp/list/react-native';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly sections: TransactionsByDaySectionInterface[];
    readonly onEndReached: () => void;
    readonly listEmptyState: ReactElement;
    readonly accountIds?: number[] | null;
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
    accountIds = null,
    footerSpacerMultiplier = 1,
    listHeader,
    listComponent: ListComponent = BudgieLegendList,
    headerOffsets
}: Props) => {
    const router = useRouter();
    const { fontScale } = useWindowDimensions();
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
            <View className="bg-surface">
                <TransactionSectionHeader title={item.title} netAmount={item.netAmount} />
            </View>
        ) : (
            <TransactionCard
                transaction={item.transaction}
                position={item.position}
                accountId={getTransactionRowAccountId(item.transaction, accountIds)}
                onPress={handlePress}
                onLongPress={handleLongPress}
            />
        );

    const { items: flatData, headerIndices } = buildTransactionListItems(sections);
    const stickyHeaderIndices = isDefined(headerOffsets) ? [] : headerIndices;

    const { handleListRef, publishHeaderOffsets } = useTransactionListHeaderOffsets(sections, headerIndices, headerOffsets);

    const contentContainerStyle = {
        paddingBottom:
            footerSpacerMultiplier * (FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN) +
            Math.max(bottom, FLOATING_TAB_BAR_MIN_BOTTOM_INSET),
        ...(isEmptyArray(flatData) && { flexGrow: 1 }),
        ...(isEmptyArray(flatData) && !isDefined(listHeader) && { justifyContent: 'center' as const })
    };

    return (
        <>
            <GroupedSurface>
                <ListComponent
                    key={fontScale}
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
            </GroupedSurface>
            <TransactionListContextMenu ref={menuRef} />
        </>
    );
};
