import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { CategoryForm, CategoryFormResult } from '../category/components/category-form/category-form';
import { CategorySelectContent } from '../category/components/category-select-content/category-select-content';
import { useCategorySelectorModal } from '../category/context/category-selector-modal.context';
import { useSearchCategoriesQuery } from '../category/query/use-search-categories.query';

type Mode = 'select' | 'create';

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
    const { currentParams, resolveCategorySelector } = useCategorySelectorModal();
    const { backgroundColor } = useFormsheetListStyles();
    const [mode, setMode] = useState<Mode>('select');
    const [search, setSearch] = useState('');
    const { categories } = useSearchCategoriesQuery(search, true);

    const { variant = 'primary', initialCategoryId = null, description, excludeCategoryIds = [] } = currentParams ?? {};
    const data = prepareCategoryData(categories, excludeCategoryIds, initialCategoryId);
    const containerStyle = { flex: 1, backgroundColor };

    const handleCreatePress = () => {
        setMode('create');
    };

    const handleCancelCreate = () => {
        setMode('select');
    };

    const handleCreateSuccess = (result: CategoryFormResult) => {
        setMode('select');
        resolveCategorySelector(result.category.id);
    };

    /* jscpd:ignore-start - FormSheet selector modal pattern */
    return (
        <View style={containerStyle}>
            {mode === 'select' ? (
                <SelectorModalSearchHeader
                    search={search}
                    onSearchChange={setSearch}
                    placeholder={t`Search categories...`}
                    rightActionIcon={UserIconNameEnum.Plus}
                    rightActionOnPress={handleCreatePress}
                />
            ) : null}

            {mode === 'select' && isNotEmptyString(description) ? (
                <View className="px-xl pb-md">
                    <Text className="text-foreground text-sm">{description}</Text>
                </View>
            ) : null}

            {mode === 'select' ? (
                <CategorySelectContent
                    data={data}
                    variant={variant}
                    initialCategoryId={initialCategoryId}
                    onSelect={resolveCategorySelector}
                />
            ) : (
                <CategoryForm defaultTitle={search} onCancel={handleCancelCreate} onSuccess={handleCreateSuccess} />
            )}
        </View>
    );
    /* jscpd:ignore-end */
}
