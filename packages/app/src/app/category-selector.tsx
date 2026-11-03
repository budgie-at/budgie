import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { EmptyState as CategoryEmptyState } from '../@generic/component/empty-state/empty-state';
import { SelectorModalDescription } from '../@generic/component/selector-modal-description/selector-modal-description';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorNoResultsState } from '../@generic/component/selector-no-results-state/selector-no-results-state';
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
    const data = prepareSelectorGridData(categories, excludeCategoryIds);
    const listData = isLoading ? null : data;
    const query = search.trim();

    const handleCreatePress = () => {
        openCategoryForm({ defaultTitle: query }, result => {
            if (isDefined(result)) {
                resolveCategorySelector(result.category.id);
            }
        });
    };

    const listEmptyComponent = isNotEmptyString(query) ? (
        <SelectorNoResultsState query={query} hint={t`Check the spelling or create it as a new category.`} onCreate={handleCreatePress} />
    ) : (
        <CategoryEmptyState title={t`No categories found`} description={t`Try a different search term`} />
    );

    return (
        <SheetSurface>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                title={t`Category`}
                placeholder={t`Search categories…`}
                createLabel={t`Create category`}
                onCreate={handleCreatePress}
                createTestID={CategorySelectorModalSelector.CreateButton}
                testID={CategorySelectorModalSelector.Input}
            />

            <SelectorModalDescription title={title} description={description}>
                {topOffset => (
                    <CategorySelectContent
                        listEmptyComponent={listEmptyComponent}
                        topOffset={topOffset}
                        data={listData}
                        variant={variant}
                        selectedCategoryIds={selectedCategoryIds}
                        onSelect={resolveCategorySelector}
                        cardTestID={CategorySelectorModalSelector.Card}
                    />
                )}
            </SelectorModalDescription>
        </SheetSurface>
    );
}
