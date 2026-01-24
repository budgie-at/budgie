import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { HapticPressable } from '../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../@generic/component/icon/icon';
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
    const flatListStyle = { flex: 1 };
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

    const listHeader = (
        <View className="pt-3xl pb-lg px-xl bg-primary-reverse">
            <View className="flex-row items-center gap-x-md">
                <View className="flex-1 flex-row items-center rounded-5xl bg-secondary-background h-[48px] px-lg border border-secondary-corner">
                    <Icon icon={UserIconNameEnum.Search} size={20} className="text-secondary-foreground" />
                    <TextInput
                        className="flex-1 text-primary text-md ml-sm"
                        value={search}
                        onChangeText={setSearch}
                        placeholder={t`Search categories...`}
                        placeholderTextColor="rgba(128, 128, 128, 0.6)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                    />
                </View>
                <HapticPressable onPress={emptyFn} className="h-[48px] w-[48px] items-center justify-center rounded-full bg-primary">
                    <Icon icon={UserIconNameEnum.Plus} size={22} className="text-primary-foreground" />
                </HapticPressable>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-primary-reverse">
            {isEmpty ? (
                <>
                    {listHeader}
                    <EmptyState title={t`No categories found`} description={t`Try a different search term`} />
                </>
            ) : (
                <FlatList
                    style={flatListStyle}
                    data={data}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    numColumns={NUM_COLUMNS}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    columnWrapperClassName="gap-x-lg mb-lg"
                    contentContainerClassName="px-xl pt-lg"
                    contentContainerStyle={contentContainerStyle}
                    ListHeaderComponent={listHeader}
                    stickyHeaderIndices={[0]}
                />
            )}
        </View>
    );
}
