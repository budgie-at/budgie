import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { LEGEND_LIST_STYLE } from '../../constant/legend-list.constant';
import { SELECTOR_TITLED_HEADER_HEIGHT } from '../../constant/selector-header-offset.constant';
import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useSheetScrollEdge } from '../../hook/use-sheet-scroll-edge/use-sheet-scroll-edge.hook';
import { BudgieLegendList } from '../budgie-legend-list/budgie-legend-list';
import { IconSelectorRow } from '../icon-selector-row/icon-selector-row';
import { SelectorScrollEdge } from '../selector-scroll-edge/selector-scroll-edge';

import type { IconSelectorRowInterface } from '../../interface/icon-selector-row.interface';
import type { UserIconType } from '@budgie/contracts';
import type { LegendListRef } from '@legendapp/list/react-native';
import type { ReactElement, RefObject } from 'react';

interface Props {
    readonly listRef: RefObject<LegendListRef | null>;
    readonly rows: readonly IconSelectorRowInterface[];
    readonly selectedIcon: UserIconType | undefined;
    readonly onSelect: (icon: UserIconType) => void;
    readonly emptyState: ReactElement;
}

const ESTIMATED_ROW_HEIGHT = 66;
const CONTENT_GAP = 8;
const keyExtractor = (row: IconSelectorRowInterface) => row.key;
const getItemType = (row: IconSelectorRowInterface) => row.kind;

export const IconSelectorList = ({ listRef, rows, selectedIcon, onSelect, emptyState }: Props) => {
    const { scrollOffset, handleScroll } = useSheetScrollEdge();
    const chromeHeight = SELECTOR_TITLED_HEADER_HEIGHT;
    const contentContainerStyle = useFormsheetListContentStyle(0, chromeHeight + CONTENT_GAP);

    const stickyHeaderIndices = rows.flatMap((row, index) => (isDefined(row.title) ? [index] : []));
    const stickyHeaderConfig = { offset: chromeHeight };

    const renderItem = ({ item }: { item: IconSelectorRowInterface }) => (
        <IconSelectorRow row={item} selectedIcon={selectedIcon} onSelect={onSelect} />
    );

    return (
        <>
            <View className="absolute inset-0">
                <BudgieLegendList
                    ref={listRef}
                    style={LEGEND_LIST_STYLE}
                    data={rows}
                    keyExtractor={keyExtractor}
                    getItemType={getItemType}
                    stickyHeaderIndices={stickyHeaderIndices}
                    stickyHeaderConfig={stickyHeaderConfig}
                    renderItem={renderItem}
                    estimatedItemSize={ESTIMATED_ROW_HEIGHT}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={contentContainerStyle}
                    ListEmptyComponent={emptyState}
                />
            </View>

            <SelectorScrollEdge scrollOffset={scrollOffset} top={chromeHeight} />
        </>
    );
};
