import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ICON_SELECTOR_COLUMNS } from '../../constant/icon-selector-columns.constant';
import { LEGEND_LIST_STYLE } from '../../constant/legend-list.constant';
import { SELECTOR_TITLED_HEADER_HEIGHT } from '../../constant/selector-header-offset.constant';
import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useSheetScrollEdge } from '../../hook/use-sheet-scroll-edge/use-sheet-scroll-edge.hook';
import { BudgieLegendList } from '../budgie-legend-list/budgie-legend-list';
import { IconSelectorChipStrip } from '../icon-selector-chip-strip/icon-selector-chip-strip';
import { IconSelectorTileRow } from '../icon-selector-tile-row/icon-selector-tile-row';
import { SelectorScrollEdge } from '../selector-scroll-edge/selector-scroll-edge';

import type { IconSelectorChipInterface } from '../../interface/icon-selector-chip.interface';
import type { IconSelectorRowInterface } from '../../interface/icon-selector-row.interface';
import type { UserIconType } from '@budgie/contracts';
import type { LegendListRef } from '@legendapp/list/react-native';
import type { ReactElement, RefObject } from 'react';

interface Props {
    readonly listRef: RefObject<LegendListRef | null>;
    readonly rows: readonly IconSelectorRowInterface[];
    readonly chips: readonly IconSelectorChipInterface[];
    readonly selectedIcon: UserIconType | undefined;
    readonly onSelect: (icon: UserIconType) => void;
    readonly emptyState: ReactElement;
}

const ESTIMATED_ROW_HEIGHT = 66;
const CONTENT_GAP = 8;
const CHIP_STRIP_HEIGHT = 44;
const TITLE_ROW_HEIGHT = 36;
const SPACER_ROW_HEIGHT = 16;
const TILE_GAP = 8;
const LIST_HORIZONTAL_PADDING = 16;

const keyExtractor = (row: IconSelectorRowInterface) => row.key;

const getItemType = (row: IconSelectorRowInterface) => {
    if (isDefined(row.title)) {
        return 'title';
    }

    return isNotEmptyArray(row.entries) ? 'tiles' : 'spacer';
};

const getRowHeight = (row: IconSelectorRowInterface, width: number) => {
    if (isDefined(row.title)) {
        return TITLE_ROW_HEIGHT;
    }

    if (!isNotEmptyArray(row.entries)) {
        return SPACER_ROW_HEIGHT;
    }

    return (width - LIST_HORIZONTAL_PADDING * 2 - TILE_GAP * (ICON_SELECTOR_COLUMNS - 1)) / ICON_SELECTOR_COLUMNS + TILE_GAP;
};

export const IconSelectorList = ({ listRef, rows, chips, selectedIcon, onSelect, emptyState }: Props) => {
    const { width } = useWindowDimensions();
    const [activeChipIndex, setActiveChipIndex] = useState(0);
    const { scrollOffset, handleScroll } = useSheetScrollEdge();
    const hasChips = isNotEmptyArray(chips);
    const chromeHeight = SELECTOR_TITLED_HEADER_HEIGHT + (hasChips ? CHIP_STRIP_HEIGHT : 0);
    const contentContainerStyle = useFormsheetListContentStyle(0, chromeHeight + CONTENT_GAP);

    const handleChipSelect = (index: number) => {
        setActiveChipIndex(index);
        void listRef.current?.scrollToIndex({ index: chips[index]?.rowIndex ?? 0, animated: false, viewOffset: chromeHeight });
    };
    const handleViewableItemsChanged = () => {
        const state = listRef.current?.getState();
        const pinnedTop = (state?.scroll ?? 0) - CONTENT_GAP + 1;

        setActiveChipIndex(
            chips.reduce(
                (active, chip, index) => (isDefined(state) && state.positionAtIndex(chip.rowIndex) <= pinnedTop ? index : active),
                0
            )
        );
    };
    const getFixedItemSize = (row: IconSelectorRowInterface) => getRowHeight(row, width);

    const stickyHeaderIndices = rows.flatMap((row, index) => (isDefined(row.title) ? [index] : []));
    const stickyHeaderConfig = { offset: chromeHeight };
    const chipStripStyle = { top: SELECTOR_TITLED_HEADER_HEIGHT };

    const renderItem = ({ item }: { item: IconSelectorRowInterface }) => {
        if (isDefined(item.title)) {
            return (
                <View className="h-[36px] justify-end bg-surface pb-md">
                    <Text className="text-secondary-foreground text-[15px] font-semibold" accessibilityRole="header">
                        {item.title}
                    </Text>
                </View>
            );
        }

        return isNotEmptyArray(item.entries) ? (
            <IconSelectorTileRow entries={item.entries} selectedIcon={selectedIcon} onSelect={onSelect} />
        ) : (
            <View className="h-[16px]" />
        );
    };

    return (
        <>
            <View className="absolute inset-0">
                <BudgieLegendList
                    ref={listRef}
                    style={LEGEND_LIST_STYLE}
                    data={rows}
                    keyExtractor={keyExtractor}
                    getItemType={getItemType}
                    getFixedItemSize={getFixedItemSize}
                    stickyHeaderIndices={stickyHeaderIndices}
                    stickyHeaderConfig={stickyHeaderConfig}
                    renderItem={renderItem}
                    estimatedItemSize={ESTIMATED_ROW_HEIGHT}
                    keyboardShouldPersistTaps="handled"
                    onScroll={handleScroll}
                    onViewableItemsChanged={handleViewableItemsChanged}
                    scrollEventThrottle={16}
                    contentContainerStyle={contentContainerStyle}
                    ListEmptyComponent={emptyState}
                />
            </View>

            {hasChips ? (
                <View className="absolute left-0 right-0 z-20 h-[44px] bg-surface" style={chipStripStyle}>
                    <IconSelectorChipStrip chips={chips} activeIndex={activeChipIndex} onSelect={handleChipSelect} />
                </View>
            ) : null}

            <SelectorScrollEdge scrollOffset={scrollOffset} top={chromeHeight} />
        </>
    );
};
