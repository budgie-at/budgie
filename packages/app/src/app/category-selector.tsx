/* jscpd:ignore-start - Selector modal imports pattern */
import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CategoryPickerBottomSheetSelectors } from '../@e2e/selectors/category-picker-bottom-sheet.selector';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
/* jscpd:ignore-end */
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { CategorySelectContent } from '../category/components/category-select-content/category-select-content';
import { useCategoryFormModal } from '../category/context/category-form-modal.context';
import { useCategorySelectorModal } from '../category/context/category-selector-modal.context';
import { useSearchCategoriesQuery } from '../category/query/use-search-categories.query';

const NUM_COLUMNS = 3;

const prepareCategoryData = (
    categories: CategoryEntityInterface[] | null,
    excludeCategoryIds: number[],
    initialCategoryId: number | null
) => {
    const filtered = isNotEmptyArray(categories) ? categories.filter(category => !excludeCategoryIds.includes(category.id)) : [];

    return padFlatListData(sortSelectedFirst(filtered, isDefined(initialCategoryId) ? [initialCategoryId] : []), NUM_COLUMNS);
};

export default function CategorySelectorModal() {
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();
    const [, resolveCategorySelector, currentParams] = useCategorySelectorModal();
    const { backgroundColor } = useFormsheetListStyles();
    const [search, setSearch] = useState('');
    const { categories } = useSearchCategoriesQuery(search, true);

    const { variant = 'primary', initialCategoryId = null, description, excludeCategoryIds = [] } = currentParams ?? {};
    const data = prepareCategoryData(categories, excludeCategoryIds, initialCategoryId);
    const containerStyle = { flex: 1, backgroundColor };

    const handleCreatePress = async () => {
        const result = await openCategoryForm({ defaultTitle: search });
        if (isDefined(result)) {
            resolveCategorySelector(result.category.id);
        }
    };

    /* jscpd:ignore-start - FormSheet selector modal pattern */
    return (
        <View style={containerStyle} collapsable={false}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search categories...`}
                rightActionIcon={UserIconNameEnum.Plus}
                rightActionOnPress={handleCreatePress}
                testID={CategoryPickerBottomSheetSelectors.Input}
            />

            {isNotEmptyString(description) ? (
                <View className="px-xl pb-md">
                    <Text className="text-foreground text-sm">{description}</Text>
                </View>
            ) : null}

            <CategorySelectContent
                data={data}
                variant={variant}
                initialCategoryId={initialCategoryId}
                onSelect={resolveCategorySelector}
                cardTestID={CategoryPickerBottomSheetSelectors.Card}
            />
        </View>
    );
    /* jscpd:ignore-end */
}
