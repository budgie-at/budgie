import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { USER_ICONS_LIST, UserIcon } from '../../constant/user-icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { FlatListDataItem, padFlatListData } from '../../utils/map-to-flatlist-data.util';
import { SearchableListBottomSheet } from '../bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { IconSelectorCard } from '../icon-selector-card/icon-selector-card';

import type { RefObject } from 'react';

interface Props {
    readonly onSelect: (icon: UserIconNameEnum) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedIcon?: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
}

const keyExtractor = (item: FlatListDataItem<UserIcon>, index: number) => (item.isEmpty ? `empty-${index}` : item.name);

const flatListProps = {
    contentContainerClassName: 'gap-y-lg px-6 pt-[30px]',
    columnWrapperClassName: 'gap-x-lg',
    numColumns: 4
};

export const IconSelectorBottomSheet = ({ ref, selectedIcon, variant, onSelect }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');

    const searchLower = search.toLowerCase();
    const filteredIcons = USER_ICONS_LIST.filter(
        ({ name, tags }) => name.toLowerCase().includes(searchLower) || tags.some(tag => tag.includes(searchLower))
    );
    const data = padFlatListData(filteredIcons.slice(0, 100));

    const handleSelect = (icon: UserIconNameEnum) => {
        onSelect(icon);
        ref.current?.dismiss();
    };

    const renderItem = ({ item }: { item: FlatListDataItem<UserIcon> }) =>
        item.isEmpty ? (
            <View className="flex-1" />
        ) : (
            <IconSelectorCard
                variant={variant}
                icon={item.name}
                isSelected={item.name === selectedIcon}
                name={item.name}
                onSelect={handleSelect}
            />
        );

    return (
        <SearchableListBottomSheet
            ref={ref}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search icons (e.g., money, travel, food)...`}
            search={search}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyDescription={t`No icons found`}
            emptyTitle={t`No icons`}
            data={data}
            flatListProps={flatListProps}
        />
    );
};
