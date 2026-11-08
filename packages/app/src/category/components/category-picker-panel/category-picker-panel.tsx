import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalDescription } from '../../../@generic/component/selector-modal-description/selector-modal-description';
import { SelectorModalSearchHeader } from '../../../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorNoResultsState } from '../../../@generic/component/selector-no-results-state/selector-no-results-state';
import { prepareSelectorGridData } from '../../../@generic/utils/prepare-selector-grid-data.util';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';
import { useSearchCategoriesQuery } from '../../query/use-search-categories.query';
import { CategoryCreateRow } from '../category-create-row/category-create-row';
import { CategorySelectContent } from '../category-select-content/category-select-content';

import type { CategoryPickerParamsInterface } from '../../interface/category-picker-params.interface';

interface Props {
    readonly params: CategoryPickerParamsInterface;
    readonly onSelect: (categoryId: number) => void;
    readonly onBack?: () => void;
    readonly onCreate: (defaultTitle: string) => void;
}

export const CategoryPickerPanel = (props: Props) => {
    const { params, onSelect, onBack, onCreate } = props;
    const { variant, initialCategoryId, excludeCategoryIds = [], title, description, syncZone } = params;
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { categories, isLoading } = useSearchCategoriesQuery(search, true, syncZone);

    const selectedCategoryIds = isDefined(initialCategoryId) ? [initialCategoryId] : [];
    const data = prepareSelectorGridData(categories, excludeCategoryIds);
    const query = search.trim();

    const handleCreatePress = () => {
        onCreate(query);
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
