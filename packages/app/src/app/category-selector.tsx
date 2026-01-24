import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useCategorySelectorModal } from '../@generic/context/category-selector-modal.context';
import { FlatListDataItem, padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { CategorySelectorCard } from '../category/components/category-selector-card/category-selector-card';
import { useSearchCategoriesQuery } from '../category/query/use-search-categories.query';

const NUM_COLUMNS = 3;

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

const prepareCategoryData = (
    categories: CategoryEntityInterface[] | null,
    excludeCategoryIds: number[],
    initialCategoryId: number | null
) => {
    const filtered = isNotEmptyArray(categories) ? categories.filter(category => !excludeCategoryIds.includes(category.id)) : [];
    const sorted = sortSelectedFirst(filtered, isDefined(initialCategoryId) ? [initialCategoryId] : []);

    return padFlatListData(sorted, NUM_COLUMNS);
};

export default function CategorySelectorModal() {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { currentParams, resolveCategorySelector } = useCategorySelectorModal();
    const [search, setSearch] = useState('');
    const { categories } = useSearchCategoriesQuery(search, true);

    const variant = currentParams?.variant ?? 'primary';
    const initialCategoryId = currentParams?.initialCategoryId ?? null;
    const data = prepareCategoryData(categories, currentParams?.excludeCategoryIds ?? [], initialCategoryId);
    const isEmpty = !isNotEmptyArray(data);

    const handleSelect = (categoryId: number) => void resolveCategorySelector(categoryId);

    const contentContainerStyle = { paddingBottom: bottom };

    const renderItem = ({ item }: { item: FlatListDataItem<CategoryEntityInterface> }) =>
        item.isEmpty ? (
            <CategorySelectorCard
                className="opacity-0"
                isSelected={false}
                onSelect={emptyFn}
                title=""
                variant={variant}
                icon={UserIconNameEnum.Circle}
                id={0}
            />
        ) : (
            <CategorySelectorCard
                isSelected={item.id === initialCategoryId}
                onSelect={handleSelect}
                title={item.title}
                variant={variant}
                icon={item.icon}
                id={item.id}
            />
        );

    return (
        <View className="flex-1 min-h-[900px]">
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search categories...`}
                rightActionIcon={UserIconNameEnum.Plus}
                rightActionOnPress={emptyFn}
            />

            {isEmpty ? (
                <View className="flex-1 items-center mt-[80px]">
                    <EmptyState title={t`No categories found`} description={t`Try a different search term`} />
                </View>
            ) : (
                <FlatList
                    className="flex-1"
                    data={data}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    numColumns={NUM_COLUMNS}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    columnWrapperClassName="gap-x-lg mb-lg"
                    contentContainerClassName="px-xl pt-[80px]"
                    contentContainerStyle={contentContainerStyle}
                />
            )}
        </View>
    );
}
