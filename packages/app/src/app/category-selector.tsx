import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useCategorySelectorModal } from '../@generic/context/category-selector-modal.context';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { CategoryCreateForm } from '../category/components/category-create-form/category-create-form';
import { CategorySelectContent } from '../category/components/category-select-content/category-select-content';
import { useCategoryForm } from '../category/hooks/use-category-form.hook';
import { useSearchCategoriesQuery } from '../category/query/use-search-categories.query';
import { useThemeContext } from '../theme/context/theme.context';

type Mode = 'select' | 'create';

const NUM_COLUMNS = 3;

const prepareCategoryData = (
    categories: CategoryEntityInterface[] | null,
    excludeCategoryIds: number[],
    initialCategoryId: number | null
) => {
    const filtered = isNotEmptyArray(categories) ? categories.filter(category => !excludeCategoryIds.includes(category.id)) : [];
    const sorted = sortSelectedFirst(filtered, isDefined(initialCategoryId) ? [initialCategoryId] : []);

    return padFlatListData(sorted, NUM_COLUMNS);
};

const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

export default function CategorySelectorModal() {
    const { t } = useLingui();
    const { currentParams, resolveCategorySelector } = useCategorySelectorModal();
    const { isDarkColorSchema } = useThemeContext();

    const [mode, setMode] = useState<Mode>('select');
    const [search, setSearch] = useState('');

    const containerStyle = { flex: 1, backgroundColor: isDarkColorSchema ? BG_DARK : BG_LIGHT };

    const { categories } = useSearchCategoriesQuery(search, true);
    const { handleSubmit, reset, control, register } = useCategoryForm(null, search);

    const variant = currentParams?.variant ?? 'primary';
    const initialCategoryId = currentParams?.initialCategoryId ?? null;
    const data = prepareCategoryData(categories, currentParams?.excludeCategoryIds ?? [], initialCategoryId);

    const handleCreatePress = () => {
        reset({ icon: UserIconNameEnum.Home, title: search });
        setMode('create');
    };

    const handleCancelCreate = () => {
        reset();
        setMode('select');
    };

    const handleCreateSuccess = (categoryId: number) => {
        setMode('select');
        resolveCategorySelector(categoryId);
    };

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

            {mode === 'select' ? (
                <CategorySelectContent
                    data={data}
                    variant={variant}
                    initialCategoryId={initialCategoryId}
                    onSelect={resolveCategorySelector}
                />
            ) : (
                <CategoryCreateForm
                    control={control}
                    register={register}
                    reset={reset}
                    handleSubmit={handleSubmit}
                    onCancel={handleCancelCreate}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </View>
    );
}
