import { isEmojiIcon } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { IconSelectorEmptyState } from '../@generic/component/icon-selector-empty-state/icon-selector-empty-state';
import { IconSelectorList } from '../@generic/component/icon-selector-list/icon-selector-list';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SheetBottomFade } from '../@generic/component/sheet-bottom-fade/sheet-bottom-fade';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { ICON_SELECTOR_COLUMNS } from '../@generic/constant/icon-selector-columns.constant';
import { useIconSelectorModal, useIconSelectorModalParams } from '../@generic/context/icon-selector-modal.context';
import { IconCategoryEnum } from '../@generic/enum/icon-category.enum';
import { useIconSearchCatalog } from '../@generic/hook/use-icon-search-catalog.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { IconSelectorChipInterface } from '../@generic/interface/icon-selector-chip.interface';
import { IconSelectorRowInterface } from '../@generic/interface/icon-selector-row.interface';
import { IconSelectorSectionInterface } from '../@generic/interface/icon-selector-section.interface';
import { iconSearchService } from '../@generic/service/icon-search.service';
import { resolveReiconIcon } from '../@generic/utils/resolve-reicon-icon.util';

import { IconSelectorModalSelector } from './icon-selector-modal.selector';

import type { LegendListRef } from '@legendapp/list/react-native';

const ICON_CATEGORY_LABEL: Record<IconCategoryEnum, MessageDescriptor> = {
    [IconCategoryEnum.MONEY]: msg`Money`,
    [IconCategoryEnum.SHOPPING]: msg`Shopping`,
    [IconCategoryEnum.FOOD]: msg`Food & drink`,
    [IconCategoryEnum.HOME]: msg`Home`,
    [IconCategoryEnum.TRANSPORT]: msg`Transport`,
    [IconCategoryEnum.TRAVEL]: msg`Travel`,
    [IconCategoryEnum.HEALTH]: msg`Health`,
    [IconCategoryEnum.ENTERTAINMENT]: msg`Entertainment`,
    [IconCategoryEnum.EDUCATION]: msg`Education`,
    [IconCategoryEnum.GIFTS]: msg`Gifts`,
    [IconCategoryEnum.WORK]: msg`Work`,
    [IconCategoryEnum.EMOJI_SMILEYS]: msg`Smileys & people`,
    [IconCategoryEnum.EMOJI_ANIMALS]: msg`Animals & nature`,
    [IconCategoryEnum.EMOJI_FOOD]: msg`Food & drink`,
    [IconCategoryEnum.EMOJI_TRAVEL]: msg`Travel & places`,
    [IconCategoryEnum.EMOJI_ACTIVITIES]: msg`Activities`,
    [IconCategoryEnum.EMOJI_OBJECTS]: msg`Objects`,
    [IconCategoryEnum.EMOJI_SYMBOLS]: msg`Symbols`,
    [IconCategoryEnum.EMOJI_FLAGS]: msg`Flags`
};

const MAX_BROWSE_SECTION_SIZE = ICON_SELECTOR_COLUMNS * 3;

const toRows = (sections: readonly IconSelectorSectionInterface[]): IconSelectorRowInterface[] =>
    sections
        .filter(({ entries }) => isNotEmptyArray(entries))
        .flatMap(({ title, entries }) => [
            { key: `title-${title}`, title, entries: [] },
            ...Array.from({ length: Math.ceil(entries.length / ICON_SELECTOR_COLUMNS) }, (_, index) => ({
                key: `${title}-${index}`,
                title: null,
                entries: entries.slice(index * ICON_SELECTOR_COLUMNS, (index + 1) * ICON_SELECTOR_COLUMNS)
            })),
            { key: `spacer-${title}`, title: null, entries: [] }
        ]);

const toChips = (rows: readonly IconSelectorRowInterface[]): IconSelectorChipInterface[] =>
    rows.flatMap((row, index) => {
        const firstIcon = rows[index + 1]?.entries[0]?.icon;
        const label = isDefined(firstIcon) && isEmojiIcon(firstIcon) ? firstIcon : row.title;

        return isDefined(row.title) && isDefined(label) ? [{ label, title: row.title, rowIndex: index }] : [];
    });

export default function IconSelectorModal() {
    const { t } = useLingui();
    const [, resolveIconSelector, dismissIconSelector] = useIconSelectorModal();
    useModalDismiss(dismissIconSelector);
    const { selectedIcon, keywords = [], excludedIcons } = useIconSelectorModalParams() ?? {};
    const [search, setSearch] = useState('');
    const listRef = useRef<LegendListRef>(null);
    const { entries, isLoading, isFailure, retry } = useIconSearchCatalog();

    const handleSearchChange = (value: string) => {
        setSearch(value);
        void listRef.current?.scrollToOffset({ offset: 0, animated: false });
    };

    const isSearching = isNotEmptyString(search.trim());
    const selectedCatalogIcon = isDefined(selectedIcon) && !isEmojiIcon(selectedIcon) ? resolveReiconIcon(selectedIcon) : selectedIcon;
    const toBrowseSections = () => {
        const popularEntries = iconSearchService
            .popular(entries, keywords, excludedIcons, selectedCatalogIcon)
            .slice(0, ICON_SELECTOR_COLUMNS);
        const pinnedIcons = new Set(popularEntries.map(({ icon }) => icon));

        return [
            { title: isNotEmptyArray(keywords) ? t`Suggested` : t`Popular`, entries: popularEntries },
            ...iconSearchService.categorize(entries).map(section => {
                const sectionEntries = section.entries.filter(({ icon }) => !pinnedIcons.has(icon));
                const isEmojiSection = sectionEntries.some(({ icon }) => isEmojiIcon(icon));

                return {
                    title: t(ICON_CATEGORY_LABEL[section.category]),
                    entries: isEmojiSection ? sectionEntries : sectionEntries.slice(0, MAX_BROWSE_SECTION_SIZE)
                };
            })
        ];
    };
    const toSearchSections = () => {
        const matchedEntries = iconSearchService.rank(entries, [search]);

        return [
            { title: t`Icons`, entries: matchedEntries.filter(({ icon }) => !isEmojiIcon(icon)) },
            { title: t`Emoji`, entries: matchedEntries.filter(({ icon }) => isEmojiIcon(icon)) }
        ];
    };
    const rows = isFailure ? [] : toRows(isSearching ? toSearchSections() : toBrowseSections());
    const chips = isSearching ? [] : toChips(rows);

    return (
        <SheetSurface>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={handleSearchChange}
                title={t`Icon`}
                placeholder={t`Search icons`}
                testID={IconSelectorModalSelector.SearchInput}
            />

            <IconSelectorList
                listRef={listRef}
                rows={rows}
                chips={chips}
                selectedIcon={selectedCatalogIcon}
                onSelect={resolveIconSelector}
                emptyState={<IconSelectorEmptyState query={search.trim()} isFailure={isFailure} isLoading={isLoading} onRetry={retry} />}
            />

            <SheetBottomFade />
        </SheetSurface>
    );
}
