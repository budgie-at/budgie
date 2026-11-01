import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { LEGEND_LIST_STYLE } from '../../constant/legend-list.constant';
import { SELECTOR_TITLED_HEADER_HEIGHT, SELECTOR_TITLED_HEADER_OFFSET } from '../../constant/selector-header-offset.constant';
import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useSectionIndex } from '../../hook/use-section-index/use-section-index.hook';
import { useSheetScrollEdge } from '../../hook/use-sheet-scroll-edge/use-sheet-scroll-edge.hook';
import { cn } from '../../utils/cn.util';
import { flattenSelectorSections } from '../../utils/flatten-selector-sections.util';
import { BudgieLegendList } from '../budgie-legend-list/budgie-legend-list';
import { GroupedListItem } from '../grouped-list-item/grouped-list-item';
import { GroupedListSectionTitle } from '../grouped-list-section-title/grouped-list-section-title';
import { SectionIndexRail } from '../section-index-rail/section-index-rail';
import { SelectorScrollEdge } from '../selector-scroll-edge/selector-scroll-edge';
import { SheetBottomFade } from '../sheet-bottom-fade/sheet-bottom-fade';
import { SheetSurface } from '../sheet-surface/sheet-surface';

import type { SelectorListRowInterface } from '../../interface/selector-list-row.interface';
import type { SelectorSectionInterface } from '../../interface/selector-section.interface';
import type { ReactElement } from 'react';

interface Props<T> {
    readonly header: ReactElement;
    readonly sections: readonly SelectorSectionInterface<T>[];
    readonly keyExtractor: (item: T) => string;
    readonly renderItem: (item: T) => ReactElement;
    readonly emptyState: ReactElement;
}

const ESTIMATED_ROW_HEIGHT = 60;
const RAIL_GUTTER = 30;
const RAIL_POSITION_STYLE = { top: SELECTOR_TITLED_HEADER_HEIGHT, right: 4 };

const rowKeyExtractor = <T,>(row: SelectorListRowInterface<T>) => row.key;

const getRowType = <T,>(row: SelectorListRowInterface<T>) => (isDefined(row.item) ? 'item' : 'section');

export const SearchableSelectorList = <T,>({ header, sections, keyExtractor, renderItem, emptyState }: Props<T>) => {
    const contentContainerStyle = useFormsheetListContentStyle(0, SELECTOR_TITLED_HEADER_OFFSET);
    const rows = flattenSelectorSections(sections, keyExtractor);
    const { listRef, sectionLetters, visibleLetter, handleSectionLetter, handleViewableItemsChanged } = useSectionIndex(rows);
    const hasRail = isNotEmptyArray(sectionLetters);
    const listContentStyle = hasRail ? { ...contentContainerStyle, paddingRight: RAIL_GUTTER } : contentContainerStyle;
    const { scrollOffset, handleScroll } = useSheetScrollEdge();

    const renderRow = ({ item: row }: { item: SelectorListRowInterface<T> }) =>
        isDefined(row.item) ? (
            <View className={cn(row.isLast && 'pb-3xl')}>
                <GroupedListItem isFirst={row.isFirst} isLast={row.isLast}>
                    {renderItem(row.item)}
                </GroupedListItem>
            </View>
        ) : (
            <View className="pt-md">
                <GroupedListSectionTitle title={row.title ?? ''} />
            </View>
        );

    return (
        <SheetSurface>
            {header}

            <SelectorScrollEdge scrollOffset={scrollOffset} top={SELECTOR_TITLED_HEADER_HEIGHT} />

            <View className="absolute inset-0">
                <BudgieLegendList
                    ref={listRef}
                    style={LEGEND_LIST_STYLE}
                    data={rows}
                    keyExtractor={rowKeyExtractor}
                    getItemType={getRowType}
                    estimatedItemSize={ESTIMATED_ROW_HEIGHT}
                    renderItem={renderRow}
                    keyboardShouldPersistTaps="handled"
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={listContentStyle}
                    onViewableItemsChanged={handleViewableItemsChanged}
                    ListEmptyComponent={<View className="pt-7xl">{emptyState}</View>}
                />
            </View>

            {hasRail ? (
                <View className="absolute z-30 pt-md" style={RAIL_POSITION_STYLE}>
                    <SectionIndexRail letters={sectionLetters} activeLetter={visibleLetter} onSelect={handleSectionLetter} />
                </View>
            ) : null}

            <SheetBottomFade />
        </SheetSurface>
    );
};
