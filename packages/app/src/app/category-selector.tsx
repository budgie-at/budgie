import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { CategorySelectContent } from '../category/components/category-select-content/category-select-content';
import { useCategoryFormModal } from '../category/context/category-form-modal.context';
import { useCategorySelectorModal, useCategorySelectorModalParams } from '../category/context/category-selector-modal.context';
import { useSearchCategoriesQuery } from '../category/query/use-search-categories.query';

import { CategorySelectorModalSelector } from './category-selector-modal.selector';

const NUM_COLUMNS = 3;

const prepareCategoryData = (categories: CategoryEntityInterface[] | null, excludeCategoryIds: number[], selectedCategoryIds: number[]) => {
    const filtered = isNotEmptyArray(categories) ? categories.filter(category => !excludeCategoryIds.includes(category.id)) : [];

    return padFlatListData(sortSelectedFirst(filtered, selectedCategoryIds), NUM_COLUMNS);
};

export default function CategorySelectorModal() {
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();
    const [, resolveCategorySelector, dismissCategorySelector] = useCategorySelectorModal();
    useModalDismiss(dismissCategorySelector);
    const currentParams = useCategorySelectorModalParams();
    const [search, setSearch] = useState('');
    const { categories, isLoading } = useSearchCategoriesQuery(search, true);

    const { variant = 'primary', initialCategoryId = null, description, excludeCategoryIds = [] } = currentParams ?? {};
    const selectedCategoryIds = isDefined(initialCategoryId) ? [initialCategoryId] : [];
    const data = prepareCategoryData(categories, excludeCategoryIds, selectedCategoryIds);

    const handleCreatePress = () => {
        openCategoryForm({ defaultTitle: search }, result => {
            if (isDefined(result)) {
                resolveCategorySelector(result.category.id);
            }
        });
    };

    return (
        <View className="flex-1 bg-primary-reverse" collapsable={false}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search categories...`}
                rightActionIcon={UserIconNameEnum.Plus}
                rightActionOnPress={handleCreatePress}
                rightActionTestID={CategorySelectorModalSelector.CreateButton}
                testID={CategorySelectorModalSelector.Input}
            />

            {isNotEmptyString(description) ? (
                <View className="px-xl pb-md">
                    <Text className="text-foreground text-sm">{description}</Text>
                </View>
            ) : null}

            <CategorySelectContent
                data={data}
                variant={variant}
                selectedCategoryIds={selectedCategoryIds}
                isLoading={isLoading}
                onSelect={resolveCategorySelector}
                cardTestID={CategorySelectorModalSelector.Card}
            />
        </View>
    );
}
