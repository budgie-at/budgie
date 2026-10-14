import { isEmojiIcon, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { emptyFn, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { IconSelectorCard } from '../@generic/component/icon-selector-card/icon-selector-card';
import { IconSuggestions } from '../@generic/component/icon-suggestions/icon-suggestions';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useIconSelectorModal, useIconSelectorModalParams } from '../@generic/context/icon-selector-modal.context';
import { useFormsheetListContentStyle } from '../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useIconSearchEntries } from '../@generic/hook/use-icon-search-entries.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { IconSearchEntryInterface } from '../@generic/interface/icon-search-entry.interface';
import { iconSearchService } from '../@generic/service/icon-search.service';
import { FlatListDataItem, padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { resolveReiconIcon } from '../@generic/utils/resolve-reicon-icon.util';

import { IconSelectorModalSelector } from './icon-selector-modal.selector';

const NUM_COLUMNS = 4;

const keyExtractor = (item: FlatListDataItem<IconSearchEntryInterface>, index: number) => (item.isEmpty ? `empty-${index}` : item.icon);

export default function IconSelectorModal() {
    const { t } = useLingui();
    const [, resolveIconSelector, dismissIconSelector] = useIconSelectorModal();
    useModalDismiss(dismissIconSelector);
    const currentParams = useIconSelectorModalParams();
    const contentContainerStyle = useFormsheetListContentStyle();
    const [search, setSearch] = useState('');
    const entries = useIconSearchEntries();

    const { selectedIcon, variant = 'default', keywords = [] } = currentParams ?? {};
    const hasSearch = isNotEmptyString(search.trim());
    const matchedEntries = hasSearch ? iconSearchService.rank(entries, [search]) : entries;
    const data = padFlatListData([...matchedEntries], NUM_COLUMNS);

    const renderItem = ({ item }: { item: FlatListDataItem<IconSearchEntryInterface> }) => {
        const selectedCatalogIcon = isDefined(selectedIcon) && !isEmojiIcon(selectedIcon) ? resolveReiconIcon(selectedIcon) : selectedIcon;

        return item.isEmpty ? (
            <IconSelectorCard
                className="opacity-0"
                isSelected={false}
                onSelect={emptyFn}
                label=""
                variant={variant}
                icon={UserIconNameEnum.Circle}
            />
        ) : (
            <IconSelectorCard
                isSelected={item.icon === selectedCatalogIcon}
                onSelect={resolveIconSelector}
                label={item.label}
                variant={variant}
                icon={item.icon}
            />
        );
    };

    const listHeader = hasSearch ? null : (
        <View className="gap-y-xl">
            <IconSuggestions terms={keywords} limit={8} onSelect={resolveIconSelector} testID={IconSelectorModalSelector.Suggestions}>
                <Text className="text-secondary-foreground px-xs text-xxs font-semibold uppercase tracking-widest">
                    <Trans>Suggested</Trans>
                </Text>
            </IconSuggestions>

            <View className="flex-row items-center gap-x-md px-xs">
                <Text className="text-secondary-foreground text-xxs font-semibold uppercase tracking-widest">
                    <Trans>All icons</Trans>
                </Text>
                <View className="h-px flex-1 bg-secondary-corner" />
            </View>
        </View>
    );

    const listEmptyComponent = isNotEmptyArray(entries) ? (
        <View className="flex-1 justify-center">
            <EmptyState title={t`No icons found`} description={t`Try a different search term`} />
        </View>
    ) : null;

    return (
        <View className="flex-1 bg-primary-reverse" collapsable={false}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search icons and emoji in any language...`}
                testID={IconSelectorModalSelector.SearchInput}
            />

            <FlatList
                className="absolute inset-0 bg-primary-reverse"
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                numColumns={NUM_COLUMNS}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                columnWrapperClassName="gap-x-lg mb-lg"
                contentContainerStyle={contentContainerStyle}
                ListHeaderComponent={listHeader}
                ListHeaderComponentClassName="mb-xl"
                ListEmptyComponent={listEmptyComponent}
                initialNumToRender={24}
                windowSize={5}
            />
        </View>
    );
}
