import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { IconSelectorCard } from '../@generic/component/icon-selector-card/icon-selector-card';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { USER_ICONS_LIST, UserIcon } from '../@generic/constant/user-icons.constant';
import { useIconSelectorModal } from '../@generic/context/icon-selector-modal.context';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { FlatListDataItem, padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';

const NUM_COLUMNS = 4;
const MAX_ICONS = 100;

const keyExtractor = (item: FlatListDataItem<UserIcon>, index: number) => (item.isEmpty ? `empty-${index}` : item.name);

const sortIconsByKeywords = (icons: UserIcon[], keywords: string[]): UserIcon[] => {
    if (keywords.length === 0) {
        return icons;
    }

    const keywordsLower = keywords.map(keyword => keyword.toLowerCase());

    const matchesKeyword = (icon: UserIcon): boolean => icon.tags.some(tag => keywordsLower.some(keyword => tag.includes(keyword)));

    const matched: UserIcon[] = [];
    const unmatched: UserIcon[] = [];

    for (const icon of icons) {
        if (matchesKeyword(icon)) {
            matched.push(icon);
        } else {
            unmatched.push(icon);
        }
    }

    return [...matched, ...unmatched];
};

const filterIcons = (search: string, keywords: string[]): FlatListDataItem<UserIcon>[] => {
    if (search.length === 0) {
        const sorted = sortIconsByKeywords(USER_ICONS_LIST, keywords);

        return padFlatListData(sorted.slice(0, MAX_ICONS), NUM_COLUMNS);
    }

    const searchLower = search.toLowerCase();
    const filtered = USER_ICONS_LIST.filter(
        ({ name, tags }) => name.toLowerCase().includes(searchLower) || tags.some(tag => tag.includes(searchLower))
    );

    return padFlatListData(filtered.slice(0, MAX_ICONS), NUM_COLUMNS);
};

export default function IconSelectorModal() {
    const { t } = useLingui();
    const [, resolveIconSelector, currentParams] = useIconSelectorModal();
    const { flatListStyle, contentContainerStyle, backgroundColor } = useFormsheetListStyles();
    const [search, setSearch] = useState('');

    const { selectedIcon, variant = 'default', keywords = [] } = currentParams ?? {};
    const data = filterIcons(search, keywords);
    const containerStyle = { flex: 1, backgroundColor };

    const handleSelect = (icon: UserIconNameEnum) => {
        resolveIconSelector(icon);
    };

    const renderItem = ({ item }: { item: FlatListDataItem<UserIcon> }) =>
        item.isEmpty ? (
            <IconSelectorCard
                className="opacity-0"
                isSelected={false}
                onSelect={emptyFn}
                name={UserIconNameEnum.Circle}
                variant={variant}
                icon={UserIconNameEnum.Circle}
            />
        ) : (
            <IconSelectorCard
                isSelected={item.name === selectedIcon}
                onSelect={handleSelect}
                name={item.name}
                variant={variant}
                icon={item.name}
            />
        );

    const listEmptyComponent = (
        <View className="flex-1 justify-center">
            <EmptyState title={t`No icons found`} description={t`Try a different search term`} />
        </View>
    );

    return (
        <View style={containerStyle}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search icons (e.g., money, travel, food)...`}
            />

            <FlatList
                style={flatListStyle}
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                numColumns={NUM_COLUMNS}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                columnWrapperClassName="gap-x-lg mb-lg"
                contentContainerStyle={contentContainerStyle}
                ListEmptyComponent={listEmptyComponent}
            />
        </View>
    );
}
