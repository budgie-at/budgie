import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { SelectorModalDescription } from '../@generic/component/selector-modal-description/selector-modal-description';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { prepareSelectorGridData } from '../@generic/utils/prepare-selector-grid-data.util';
import { CategorySelectContent } from '../category/components/category-select-content/category-select-content';
import { useCategoryFormModal } from '../category/context/category-form-modal.context';
import { useCategorySelectorModal, useCategorySelectorModalParams } from '../category/context/category-selector-modal.context';
import { useSearchCategoriesQuery } from '../category/query/use-search-categories.query';

import { CategorySelectorModalSelector } from './category-selector-modal.selector';

export default function CategorySelectorModal() {
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();
    const [, resolveCategorySelector, dismissCategorySelector] = useCategorySelectorModal();
    useModalDismiss(dismissCategorySelector);
    const currentParams = useCategorySelectorModalParams();
    const [search, setSearch] = useState('');
    const { categories, isLoading } = useSearchCategoriesQuery(search, true);

    const { variant = 'primary', initialCategoryId = null, title, description, excludeCategoryIds = [] } = currentParams ?? {};
    const selectedCategoryIds = isDefined(initialCategoryId) ? [initialCategoryId] : [];
    const data = prepareSelectorGridData(categories, excludeCategoryIds, selectedCategoryIds);

    const handleCreatePress = () => {
        openCategoryForm({ defaultTitle: search }, result => {
            if (isDefined(result)) {
                resolveCategorySelector(result.category.id);
            }
        });
    };

    return (
        <SheetSurface>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search categories…`}
                createLabel={t`Create category`}
                onCreate={handleCreatePress}
                createTestID={CategorySelectorModalSelector.CreateButton}
                testID={CategorySelectorModalSelector.Input}
            />

            <SelectorModalDescription title={title} description={description}>
                {topOffset => (
                    <CategorySelectContent
                        topOffset={topOffset}
                        data={data}
                        variant={variant}
                        selectedCategoryIds={selectedCategoryIds}
                        isLoading={isLoading}
                        onSelect={resolveCategorySelector}
                        cardTestID={CategorySelectorModalSelector.Card}
                    />
                )}
            </SelectorModalDescription>
        </SheetSurface>
    );
}
