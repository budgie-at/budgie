import { isEmojiIcon } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { IconSelectorEmptyState } from '../@generic/component/icon-selector-empty-state/icon-selector-empty-state';
import { IconSelectorList } from '../@generic/component/icon-selector-list/icon-selector-list';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SheetBottomFade } from '../@generic/component/sheet-bottom-fade/sheet-bottom-fade';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { ICON_SELECTOR_COLUMNS } from '../@generic/constant/icon-selector-columns.constant';
import { useIconSelectorModal, useIconSelectorModalParams } from '../@generic/context/icon-selector-modal.context';
import { IconSelectorSectionEnum } from '../@generic/enum/icon-selector-section.enum';
import { useIconSearchCatalog } from '../@generic/hook/use-icon-search-catalog.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { iconSearchService } from '../@generic/service/icon-search.service';
import { buildIconSelectorRows } from '../@generic/utils/build-icon-selector-rows.util';
import { resolveReiconIcon } from '../@generic/utils/resolve-reicon-icon.util';

import { IconSelectorModalSelector } from './icon-selector-modal.selector';

import type { LegendListRef } from '@legendapp/list/react-native';

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
    const popularEntries = [
        entries.find(entry => entry.icon === selectedCatalogIcon),
        ...iconSearchService.suggest(entries, keywords, excludedIcons).filter(entry => entry.icon !== selectedCatalogIcon)
    ]
        .filter(isDefined)
        .slice(0, ICON_SELECTOR_COLUMNS);
    const matches = isSearching ? iconSearchService.rank(entries, [search]) : entries;
    const rows = buildIconSelectorRows([
        { id: IconSelectorSectionEnum.POPULAR, title: t`Popular`, entries: isSearching ? [] : popularEntries },
        { id: IconSelectorSectionEnum.ICONS, title: t`Icons`, entries: matches.filter(({ icon }) => !isEmojiIcon(icon)) },
        { id: IconSelectorSectionEnum.EMOJI, title: t`Emoji`, entries: matches.filter(({ icon }) => isEmojiIcon(icon)) }
    ]);

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
                selectedIcon={selectedCatalogIcon}
                onSelect={resolveIconSelector}
                emptyState={<IconSelectorEmptyState query={search.trim()} isFailure={isFailure} isLoading={isLoading} onRetry={retry} />}
            />

            <SheetBottomFade />
        </SheetSurface>
    );
}
