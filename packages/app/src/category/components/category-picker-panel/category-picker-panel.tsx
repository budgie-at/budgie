import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalDescription } from '../../../@generic/component/selector-modal-description/selector-modal-description';
import { SelectorModalSearchHeader } from '../../../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorNoResultsState } from '../../../@generic/component/selector-no-results-state/selector-no-results-state';
import { prepareSelectorGridData } from '../../../@generic/utils/prepare-selector-grid-data.util';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';
import { useCategoryFormModal } from '../../context/category-form-modal.context';
import { useSearchCategoriesQuery } from '../../query/use-search-categories.query';
import { CategoryCreateRow } from '../category-create-row/category-create-row';
import { CategorySelectContent } from '../category-select-content/category-select-content';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly initialCategoryId: number | null;
    readonly excludeCategoryIds?: number[];
    readonly title?: string;
    readonly description?: string;
    readonly onSelect: (categoryId: number) => void;
    readonly onBack?: () => void;
    readonly onCreate?: (defaultTitle: string) => void;
}

export const CategoryPickerPanel = (props: Props) => {
    const { variant, initialCategoryId, excludeCategoryIds = [], title, description, onSelect, onBack, onCreate } = props;
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();
    const [search, setSearch] = useState('');
    const { categories, isLoading } = useSearchCategoriesQuery(search, true);

    const selectedCategoryIds = isDefined(initialCategoryId) ? [initialCategoryId] : [];
    const data = prepareSelectorGridData(categories, excludeCategoryIds);
    const query = search.trim();

    const handleCreatePress = () => {
        if (isDefined(onCreate)) {
            onCreate(query);

            return;
        }

        openCategoryForm({ defaultTitle: query }, result => {
            if (isDefined(result)) {
                onSelect(result.category.id);
            }
        });
    };

    const listEmptyComponent = isNotEmptyString(query) ? (
        <SelectorNoResultsState query={query} hint={t`Check the spelling or create it as a new category.`} onCreate={handleCreatePress} />
    ) : (
        void 0
    );

    return (
        <>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                title={t`Category`}
                placeholder={t`Search categories…`}
                testID={CategorySelectorModalSelector.Input}
                onBack={onBack}
            />

            <CategoryCreateRow onPress={handleCreatePress} />
            <SelectorModalDescription title={title} description={description}>
                <CategorySelectContent
                    listEmptyComponent={listEmptyComponent}
                    data={data}
                    isLoading={isLoading}
                    variant={variant}
                    selectedCategoryIds={selectedCategoryIds}
                    onSelect={onSelect}
                    cardTestID={CategorySelectorModalSelector.Card}
                />
            </SelectorModalDescription>
        </>
    );
};
