/* jscpd:ignore-start */
import { CategoryEntityInterface } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { useSearchableFilterState } from '../@generic/hook/use-searchable-filter-state/use-searchable-filter-state.hook';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { CategorySelectContent } from '../category/components/category-select-content/category-select-content';
import { useSearchCategoriesQuery } from '../category/query/use-search-categories.query';
import { TransactionFilterSelectorFooter } from '../transaction/components/transaction-filter-selector-footer/transaction-filter-selector-footer';
import { TransactionFilterSelectorHeader } from '../transaction/components/transaction-filter-selector-header/transaction-filter-selector-header';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';
import { useTransactionCategoryFilterModal } from '../transaction/context/transaction-category-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';

const NUM_COLUMNS = 3;
const FOOTER_BOTTOM_SPACE = 176;
const LIST_TOP_SPACE = 88;

const prepareCategoryData = (categories: CategoryEntityInterface[] | null, selectedCategoryIds: number[]) => {
    const filtered = isNotEmptyArray(categories) ? categories : [];

    return padFlatListData(sortSelectedFirst(filtered, selectedCategoryIds), NUM_COLUMNS);
};

export default function TransactionCategoryFilterModal() {
    const { t } = useLingui();
    const [, resolveTransactionCategoryFilter, currentParams] = useTransactionCategoryFilterModal();

    const state = useSearchableFilterState(currentParams?.value ?? null);
    const { localValue, setLocalValue, localValueRef, search, setSearch, selectedCount, handleDeselectAll } = state;

    const { categories, isLoading } = useSearchCategoriesQuery(search, true);

    const selectedCategoryIds = localValue ?? [];
    const data = prepareCategoryData(categories, selectedCategoryIds);

    const handleSelect = (selected: number) => void setLocalValue(previous => toggleFilterSelection(previous, [selected]));
    const handleSelectAll = () => void setLocalValue(() => (categories ?? []).map(category => category.id));
    const handleApply = () => void resolveTransactionCategoryFilter({ value: localValueRef.current });
    const handleClose = () => void resolveTransactionCategoryFilter(null);

    const applyLabel = t({
        message: plural(selectedCount, {
            0: 'Show all categories',
            one: 'Show # category',
            other: 'Show # categories'
        })
    });

    return (
        <FilterSheet>
            <TransactionFilterSelectorHeader title={t`Filter categories`} onClose={handleClose} />

            <CategorySelectContent
                data={data}
                variant="primary"
                initialCategoryId={null}
                selectedCategoryIds={selectedCategoryIds}
                isLoading={isLoading}
                alignToBottom={isNotEmptyString(search)}
                additionalBottomPadding={FOOTER_BOTTOM_SPACE}
                topOffset={LIST_TOP_SPACE}
                onSelect={handleSelect}
            />

            <TransactionFilterSelectorFooter
                searchValue={search}
                searchPlaceholder={t`Search categories...`}
                onSearchChange={setSearch}
                isLoading={isLoading}
                selectedCount={selectedCount}
                applyLabel={applyLabel}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onApply={handleApply}
                searchTestID={TransactionFiltersSelector.CategorySearchInput}
                selectAllTestID={TransactionFiltersSelector.CategorySelectAllButton}
                deselectAllTestID={TransactionFiltersSelector.CategoryDeselectAllButton}
                applyTestID={TransactionFiltersSelector.CategoryApplyButton}
            />
        </FilterSheet>
    );
}
/* jscpd:ignore-end */
