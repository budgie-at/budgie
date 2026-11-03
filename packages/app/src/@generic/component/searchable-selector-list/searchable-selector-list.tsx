import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SelectorRowKindEnum } from '../../enum/selector-row-kind.enum';
import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useSectionIndex } from '../../hook/use-section-index/use-section-index.hook';
import { cn } from '../../utils/cn.util';
import { flattenSelectorSections } from '../../utils/flatten-selector-sections.util';
import { GroupedListItem } from '../grouped-list-item/grouped-list-item';
import { GroupedListSectionTitle } from '../grouped-list-section-title/grouped-list-section-title';
import { SectionIndexRail } from '../section-index-rail/section-index-rail';
import { SelectorList } from '../selector-list/selector-list';
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
    readonly query: string;
}

const ESTIMATED_ROW_HEIGHT = 60;
const RAIL_GUTTER = 30;
const RAIL_POSITION_STYLE = { top: 0, right: 4, bottom: 24 };

const rowKeyExtractor = <T,>(row: SelectorListRowInterface<T>) => row.key;

const getRowType = <T,>(row: SelectorListRowInterface<T>) => (isDefined(row.item) ? SelectorRowKindEnum.ITEM : SelectorRowKindEnum.TITLE);

export const SearchableSelectorList = <T,>({ header, sections, keyExtractor, renderItem, emptyState, query }: Props<T>) => {
    const contentContainerStyle = useFormsheetListContentStyle();
    const rows = flattenSelectorSections(sections, keyExtractor);
    const { listRef, sectionLetters, visibleLetter, handleSectionLetter, handleViewableItemsChanged } = useSectionIndex(rows);
    const hasRail = isNotEmptyArray(sectionLetters);
    const listContentStyle = hasRail ? { ...contentContainerStyle, paddingRight: RAIL_GUTTER } : contentContainerStyle;

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

    const listOptions = {
        getItemType: getRowType,
        estimatedItemSize: ESTIMATED_ROW_HEIGHT,
        contentContainerStyle: listContentStyle,
        onViewableItemsChanged: handleViewableItemsChanged,
        ListEmptyComponent: emptyState
    };

    return (
        <SheetSurface>
            {header}

            <View className="flex-1">
                <SelectorList
                    key={query}
                    listRef={listRef}
                    data={rows}
                    keyExtractor={rowKeyExtractor}
                    renderItem={renderRow}
                    options={listOptions}
                >
                    {hasRail ? (
                        <View className="absolute z-30 justify-center pt-md" style={RAIL_POSITION_STYLE}>
                            <SectionIndexRail letters={sectionLetters} activeLetter={visibleLetter} onSelect={handleSectionLetter} />
                        </View>
                    ) : null}
                </SelectorList>
            </View>

            <SheetBottomFade />
        </SheetSurface>
    );
};
