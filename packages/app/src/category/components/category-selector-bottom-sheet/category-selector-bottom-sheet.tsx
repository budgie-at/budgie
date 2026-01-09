import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useRef, useState } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SearchableListBottomSheet } from '../../../@generic/component/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FlatListDataItem, padFlatListData } from '../../../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../../../@generic/utils/sort-selected-first.util';
import { useSearchCategoriesQuery } from '../../query/use-search-categories.query';
import { CategoryFormBottomSheet } from '../category-form-bottom-sheet/category-form-bottom-sheet';
import { CategorySelectorCard } from '../category-selector-card/category-selector-card';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly excludeCategoryIds?: number[];
    readonly onSelect: (categoryId: number | null) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedCategory: CategoryEntityInterface | null;
}

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

const flatListProps = {
    numColumns: 3,
    columnWrapperClassName: 'gap-x-lg',
    contentContainerClassName: 'gap-y-lg px-3 pt-xl'
};

export const CategorySelectorBottomSheet = ({ ref, excludeCategoryIds, selectedCategory, variant, onSelect }: Props) => {
    const { t } = useLingui();

    const [search, setSearch] = useState('');
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const categoryFormRef = useRef<BottomSheetInterface | null>(null);

    const { categories } = useSearchCategoriesQuery(search, true);

    const handleSelect = (categoryId: number) => {
        if (categoryId === selectedCategory?.id) {
            onSelect(null);

            return;
        }

        onSelect(categoryId);
        void ref.current?.dismiss();
    };

    const handleCreateCategory = () => {
        setNewCategoryTitle(search);
        void categoryFormRef.current?.open();
    };

    const handleCategoryCreated = (category: CategoryEntityInterface) => {
        setSearch('');
        setNewCategoryTitle('');
        handleSelect(category.id);
    };

    const filteredCategories = isNotEmptyArray(categories)
        ? categories.filter(category => (isDefined(excludeCategoryIds) ? !excludeCategoryIds.includes(category.id) : true))
        : [];
    const data = padFlatListData(sortSelectedFirst(filteredCategories, isDefined(selectedCategory) ? [selectedCategory.id] : []), 3);

    const handleEmptySelect = () => void 0;
    const renderItem = ({ item }: { item: FlatListDataItem<CategoryEntityInterface> }) =>
        item.isEmpty ? (
            <CategorySelectorCard
                className="opacity-0"
                isSelected={false}
                onSelect={handleEmptySelect}
                title=""
                variant={variant}
                icon={UserIconNameEnum.Circle}
                id={0}
            />
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

    const rightAction = {
        icon: UserIconNameEnum.Plus,
        onPress: handleCreateCategory
    };

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
                rightAction={rightAction}
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
