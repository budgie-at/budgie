import { UserIconNameEnum, UserIconType, isEmojiIcon } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { IconSelectorModalSelector } from '../../../app/icon-selector-modal.selector';
import { ICON_SELECTOR_COLUMNS } from '../../constant/icon-selector-columns.constant';
import { useLockstepScreenSettled } from '../../context/lockstep-stack.context';
import { IconSelectorSectionEnum } from '../../enum/icon-selector-section.enum';
import { useIconSearchCatalog } from '../../hook/use-icon-search-catalog.hook';
import { iconSearchService } from '../../service/icon-search.service';
import { buildIconSelectorRows } from '../../utils/build-icon-selector-rows.util';
import { resolveReiconIcon } from '../../utils/resolve-reicon-icon.util';
import { FadeInOnMount } from '../fade-in-on-mount/fade-in-on-mount';
import { IconSelectorEmptyState } from '../icon-selector-empty-state/icon-selector-empty-state';
import { IconSelectorList } from '../icon-selector-list/icon-selector-list';
import { SelectorModalSearchHeader } from '../selector-modal-search-header/selector-modal-search-header';
import { SheetBottomFade } from '../sheet-bottom-fade/sheet-bottom-fade';
import { SheetSurface } from '../sheet-surface/sheet-surface';

import type { LegendListRef } from '@legendapp/list/react-native';

interface Props {
    readonly selectedIcon?: UserIconType;
    readonly keywords?: string[];
    readonly excludedIcons?: readonly UserIconNameEnum[];
    readonly onSelect: (icon: UserIconType) => void;
    readonly onBack?: () => void;
    readonly className?: string;
}

export const IconPickerPanel = ({ selectedIcon, keywords = [], excludedIcons, onSelect, onBack, className }: Props) => {
    const { t } = useLingui();
    const isSettled = useLockstepScreenSettled();
    const [isDeferred] = useState(!isSettled);
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
    const matches = isSearching ? iconSearchService.rank(entries, [search]) : entries.filter(entry => !popularEntries.includes(entry));
    const rows = buildIconSelectorRows([
        { id: IconSelectorSectionEnum.POPULAR, title: t`Popular`, entries: isSearching ? [] : popularEntries },
        { id: IconSelectorSectionEnum.ICONS, title: t`Icons`, entries: matches.filter(({ icon }) => !isEmojiIcon(icon)) },
        { id: IconSelectorSectionEnum.EMOJI, title: t`Emoji`, entries: matches.filter(({ icon }) => isEmojiIcon(icon)) }
    ]);

    const list = (
        <IconSelectorList
            listRef={listRef}
            rows={rows}
            selectedIcon={selectedCatalogIcon}
            onSelect={onSelect}
            emptyState={<IconSelectorEmptyState query={search.trim()} isFailure={isFailure} isLoading={isLoading} onRetry={retry} />}
        />
    );
    const listContent = isDeferred ? <FadeInOnMount>{list}</FadeInOnMount> : list;

    return (
        <SheetSurface className={className}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={handleSearchChange}
                title={t`Icon`}
                placeholder={t`Search icons`}
                testID={IconSelectorModalSelector.SearchInput}
                onBack={onBack}
            />

            {isSettled ? listContent : null}

            <SheetBottomFade />
        </SheetSurface>
    );
};
