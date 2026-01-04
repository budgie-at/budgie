import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useRef, useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SearchableListBottomSheet } from '../../../@generic/component/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { Button } from '../../../@generic/component/button/button';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FlatListDataItem, padFlatListData } from '../../../@generic/utils/map-to-flatlist-data.util';
import { useSearchCategoriesQuery } from '../../query/use-search-categories.query';
import { CategoryFormBottomSheet } from '../category-form-bottom-sheet/category-form-bottom-sheet';
import { CategorySelectorCard } from '../category-selector-card/category-selector-card';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly excludeCategoryIds?: number[];
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

export const CategorySelectorBottomSheet = ({ ref, excludeCategoryIds, selectedCategory, variant, onSelect }: Props) => {
    const [search, setSearch] = useState('');
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const { categories } = useSearchCategoriesQuery(search, true);
    const { t } = useLingui();
    const categoryFormRef = useRef<BottomSheetInterface | null>(null);

    const handleSelect = (categoryId: number) => {
        void ref.current?.dismiss();
        onSelect(categoryId);
    };

    const handleCreateCategory = () => {
        setNewCategoryTitle(search);
        void categoryFormRef.current?.open();
    };

    const handleCategoryCreated = (category: CategoryEntityInterface) => {
        void categoryFormRef.current?.dismiss();
        setSearch('');
        setNewCategoryTitle('');
        handleSelect(category.id);
    };

    const data = padFlatListData(
        isNotEmptyArray(categories)
            ? categories.filter(category => (isDefined(excludeCategoryIds) ? !excludeCategoryIds.includes(category.id) : true))
            : []
    );

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

    const listHeaderContent = (
        <View className="px-6 pb-lg">
            <Button
                variant={variant}
                leftIcon={UserIconNameEnum.Plus}
                content={t`Create New Category`}
                onPress={handleCreateCategory}
            />
        </View>
    );

    return (
        <>
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
                listHeaderContent={listHeaderContent}
            />
            <CategoryFormBottomSheet
                ref={categoryFormRef}
                category={null}
                defaultTitle={newCategoryTitle}
                onCategoryCreated={handleCategoryCreated}
            />
        </>
    );
};
