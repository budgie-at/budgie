import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { USER_ICONS, UserIcon } from '../../constant/user-icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { BottomSheetSnapPoints } from '../../type/bottom-sheet-snap-points.type';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { FlatListDataItem, mapToFlatListData } from '../../utils/map-to-flatlist-data.util';
import { SearchableListBottomSheet } from '../bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { IconSelectorCard } from '../icon-selector-card/icon-selector-card';

import type { UserIconNameEnum } from '@budgie/contracts';
import type { RefObject } from 'react';

interface Props {
    readonly onSelect: (icon: UserIconNameEnum) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedIcon?: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
}

const snapPoints: BottomSheetSnapPoints = ['70%'];

export const IconSelectorBottomSheet = ({ ref, selectedIcon, variant, onSelect }: Props) => {
    const [search, setSearch] = useState('');
    const { t } = useLingui();

    const filteredIcons = USER_ICONS.filter(({ name }) => name.toLowerCase().includes(search.toLowerCase()));
    const data = mapToFlatListData(filteredIcons);

    const handleSelect = (icon: UserIconNameEnum) => {
        onSelect(icon);
        ref.current?.close();
    };

    const keyExtractor = (item: FlatListDataItem<UserIcon>, index: number) => (item.isEmpty ? `empty-${index}` : item.name);

    const renderItem = ({ item }: { item: FlatListDataItem<UserIcon> }) =>
        item.isEmpty ? (
            <View className="flex-1" />
        ) : (
            <IconSelectorCard
                variant={variant}
                icon={item.icon}
                isSelected={item.name === selectedIcon}
                name={item.name}
                onSelect={handleSelect}
            />
        );

    const flatListProps = {
        contentContainerClassName: 'gap-y-lg px-6 pt-[30px]',
        columnWrapperClassName: 'gap-x-lg',
        numColumns: 4,
    };

    return (
        <SearchableListBottomSheet
            ref={ref}
            snapPoints={snapPoints}
            index={1}
            title={t`Choose Icon`}
            description={t`22 icons available`}
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
