import { isEmojiIcon } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { BudgieLegendList } from '../@generic/component/budgie-legend-list/budgie-legend-list';
import { IconSelectorCard } from '../@generic/component/icon-selector-card/icon-selector-card';
import { IconSelectorEmptyState } from '../@generic/component/icon-selector-empty-state/icon-selector-empty-state';
import { IconSelectorListHeader } from '../@generic/component/icon-selector-list-header/icon-selector-list-header';
import { IconSelectorPaddingCell } from '../@generic/component/icon-selector-padding-cell/icon-selector-padding-cell';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorScrollEdge } from '../@generic/component/selector-scroll-edge/selector-scroll-edge';
import { SheetBottomFade } from '../@generic/component/sheet-bottom-fade/sheet-bottom-fade';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { ICON_SELECTOR_COLUMNS } from '../@generic/constant/icon-selector-columns.constant';
import { LEGEND_LIST_STYLE } from '../@generic/constant/legend-list.constant';
import { SELECTOR_TITLED_HEADER_HEIGHT, SELECTOR_TITLED_HEADER_OFFSET } from '../@generic/constant/selector-header-offset.constant';
import { useIconSelectorModal, useIconSelectorModalParams } from '../@generic/context/icon-selector-modal.context';
import { useFormsheetListContentStyle } from '../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useIconSearchCatalog } from '../@generic/hook/use-icon-search-catalog.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useSheetScrollEdge } from '../@generic/hook/use-sheet-scroll-edge/use-sheet-scroll-edge.hook';
import { IconSearchEntryInterface } from '../@generic/interface/icon-search-entry.interface';
import { iconSearchService } from '../@generic/service/icon-search.service';
import { FlatListDataItem, padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { resolveReiconIcon } from '../@generic/utils/resolve-reicon-icon.util';

import { IconSelectorModalSelector } from './icon-selector-modal.selector';

const COLUMN_GAP = 8;
const COLUMN_WRAPPER_STYLE = { columnGap: COLUMN_GAP, rowGap: COLUMN_GAP };
const LIST_HEADER_STYLE = { marginBottom: 12, marginHorizontal: -COLUMN_GAP / 2 };
const ESTIMATED_ROW_HEIGHT = 62;

const keyExtractor = (item: FlatListDataItem<IconSearchEntryInterface>, index: number) => (item.isEmpty ? `empty-${index}` : item.icon);

export default function IconSelectorModal() {
    const { t } = useLingui();
    const [, resolveIconSelector, dismissIconSelector] = useIconSelectorModal();
    useModalDismiss(dismissIconSelector);
    const { selectedIcon, keywords = [], excludedIcons } = useIconSelectorModalParams() ?? {};
    const contentContainerStyle = useFormsheetListContentStyle(0, SELECTOR_TITLED_HEADER_OFFSET, COLUMN_GAP);
    const [search, setSearch] = useState('');
    const { scrollOffset, handleScroll } = useSheetScrollEdge();
    const { entries, isLoading, isFailure, retry } = useIconSearchCatalog();

    const hasSearch = isNotEmptyString(search.trim());
    const selectedCatalogIcon = isDefined(selectedIcon) && !isEmojiIcon(selectedIcon) ? resolveReiconIcon(selectedIcon) : selectedIcon;
    const popularEntries = iconSearchService.popular(entries, keywords, excludedIcons, selectedCatalogIcon).slice(0, ICON_SELECTOR_COLUMNS);
    const matchedEntries = hasSearch
        ? iconSearchService.rank(entries, [search])
        : iconSearchService.browse(
              entries,
              popularEntries.map(({ icon }) => icon)
          );

    const renderItem = ({ item }: { item: FlatListDataItem<IconSearchEntryInterface> }) =>
        item.isEmpty ? (
            <IconSelectorPaddingCell />
        ) : (
            <IconSelectorCard
                isSelected={item.icon === selectedCatalogIcon}
                onSelect={resolveIconSelector}
                label={item.label}
                icon={item.icon}
            />
        );

    const listHeader =
        hasSearch || isFailure ? null : (
            <IconSelectorListHeader
                entries={popularEntries}
                keywords={keywords}
                selectedIcon={selectedCatalogIcon}
                onSelect={resolveIconSelector}
            />
        );

    return (
        <SheetSurface>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                title={t`Icon`}
                placeholder={t`Search`}
                testID={IconSelectorModalSelector.SearchInput}
            />

            <SelectorScrollEdge scrollOffset={scrollOffset} top={SELECTOR_TITLED_HEADER_HEIGHT} />

            <View className="absolute inset-0">
                <BudgieLegendList
                    style={LEGEND_LIST_STYLE}
                    data={padFlatListData([...matchedEntries], ICON_SELECTOR_COLUMNS)}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    numColumns={ICON_SELECTOR_COLUMNS}
                    estimatedItemSize={ESTIMATED_ROW_HEIGHT}
                    keyboardShouldPersistTaps="handled"
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    columnWrapperStyle={COLUMN_WRAPPER_STYLE}
                    contentContainerStyle={contentContainerStyle}
                    ListHeaderComponent={listHeader}
                    ListHeaderComponentStyle={LIST_HEADER_STYLE}
                    ListEmptyComponent={<IconSelectorEmptyState isFailure={isFailure} isLoading={isLoading} onRetry={retry} />}
                />
            </View>

            <SheetBottomFade />
        </SheetSurface>
    );
}
