import { CategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { SearchableListBottomSheet } from '../../../@generic/components/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FlatListDataItem, padFlatListData } from '../../../@generic/utils/map-to-flatlist-data.util';
import { useGetCategoriesQuery } from '../../query/use-get-categories.query';
import { CategorySelectorCard } from '../category-selector-card/category-selector-card';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (categoryId: number) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedCategory: CategoryEntityInterface | null;
}

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

const flatListProps = {
    numColumns: 2,
    columnWrapperClassName: 'gap-x-lg',
    contentContainerClassName: 'gap-y-lg px-6 pt-xl'
};

export const CategorySelectorBottomSheet = ({ ref, selectedCategory, variant, onSelect }: Props) => {
    const [search, setSearch] = useState('');
    const { categories } = useGetCategoriesQuery(search, true);
    const { t } = useLingui();

    const handleSelect = (categoryId: number) => {
        void ref.current?.dismiss();
        onSelect(categoryId);
    };

    const data = isNotEmptyArray(categories) ? padFlatListData(categories) : [];

    const renderItem = ({ item }: { item: FlatListDataItem<CategoryEntityInterface> }) =>
        item.isEmpty ? (
            <View className="flex-1" />
        ) : (
            <CategorySelectorCard
                isSelected={item.id === selectedCategory?.id}
                onSelect={handleSelect}
                title={item.title}
                variant={variant}
                icon={item.icon}
                key={item.id}
                id={item.id}
            />
        );

    return (
        <SearchableListBottomSheet
            ref={ref}
            title={t`Select Category`}
            description={t`Choose your main category`}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search categories...`}
            search={search}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyDescription={t`Try a different search term`}
            emptyTitle={t`No categories found`}
            data={data}
            flatListProps={flatListProps}
        />
    );
};
