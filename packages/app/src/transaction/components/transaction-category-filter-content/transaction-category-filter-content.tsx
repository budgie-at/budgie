import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { FilterSheetApply } from '../../../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetBulkToggle } from '../../../@generic/component/filter-sheet/filter-sheet-bulk-toggle/filter-sheet-bulk-toggle';
import { CategorySelectContent } from '../../../category/components/category-select-content/category-select-content';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';
import { useFilterSheetSelection } from '../../hook/use-filter-sheet-selection.hook';
import { prepareTransactionFilterGridData } from '../../utils/prepare-transaction-filter-grid-data.util';
import { TransactionFilterSelectionSheet } from '../transaction-filter-selection-sheet/transaction-filter-selection-sheet';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

import type { TransactionCategoryFilterResult } from '../../context/transaction-category-filter-modal.context';

interface Props {
    readonly value: number[] | null;
    readonly onCommit: (result: TransactionCategoryFilterResult) => void;
}

export const TransactionCategoryFilterContent = ({ value, onCommit }: Props) => {
    const { t } = useLingui();
    const { localValue, search, setSearch, selectedCount, handleDeselectAll, handleSelect, handleSelectAll, handleApply } =
        useFilterSheetSelection(value, onCommit);
    const { categories, isLoading } = useSearchCategoriesQuery(search, true);

    const selectedCategoryIds = localValue ?? [];
    const categoryIds = (categories ?? []).map(category => category.id);
    const data = prepareTransactionFilterGridData(categories, selectedCategoryIds);

    const handleSelectAllCategories = () => void handleSelectAll(categoryIds);

    const applyLabel = t({
        message: plural(selectedCount, {
            0: 'Show all categories',
            one: 'Show # category',
            other: 'Show # categories'
        })
    });

    return (
        <TransactionFilterSelectionSheet
            title={t`Filter categories`}
            searchPlaceholder={t`Search categories...`}
            searchValue={search}
            onSearchChange={setSearch}
            searchTestID={TransactionFiltersSelector.CategorySearchInput}
            apply={<FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelector.CategoryApplyButton} />}
            bulkToggle={
                <FilterSheetBulkToggle
                    isLoading={isLoading}
                    selectedCount={selectedCount}
                    onSelectAll={handleSelectAllCategories}
                    onDeselectAll={handleDeselectAll}
                    selectAllTestID={TransactionFiltersSelector.CategorySelectAllButton}
                    deselectAllTestID={TransactionFiltersSelector.CategoryDeselectAllButton}
                />
            }
        >
            <CategorySelectContent
                data={data}
                variant="cta"
                selectedCategoryIds={selectedCategoryIds}
                isLoading={isLoading}
                onSelect={handleSelect}
                cardTestID={TransactionFiltersSelector.CategoryOption}
            />
        </TransactionFilterSelectionSheet>
    );
};
