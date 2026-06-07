import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { useSearchableFilterState } from '../@generic/hook/use-searchable-filter-state/use-searchable-filter-state.hook';
import { TagsSelectContent } from '../tag/components/tags-select-content/tags-select-content';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';
import { TransactionFilterSelectorFooter } from '../transaction/components/transaction-filter-selector-footer/transaction-filter-selector-footer';
import { TransactionFilterSelectorHeader } from '../transaction/components/transaction-filter-selector-header/transaction-filter-selector-header';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';
import { useTransactionTagFilterModal } from '../transaction/context/transaction-tag-filter-modal.context';
import { prepareTransactionFilterGridData } from '../transaction/utils/prepare-transaction-filter-grid-data.util';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';

const FOOTER_BOTTOM_SPACE = 132;
const LIST_TOP_SPACE = 88;

export default function TransactionTagFilterModal() {
    const { t } = useLingui();
    const [, resolveTransactionTagFilter, currentParams] = useTransactionTagFilterModal();

    const state = useSearchableFilterState(currentParams?.value ?? null);
    const { localValue, setLocalValue, localValueRef, search, setSearch, selectedCount, handleDeselectAll } = state;

    const { tags, isLoading } = useSearchTagsQuery(search);

    const selectedTagIds = localValue ?? [];
    const data = prepareTransactionFilterGridData(tags, selectedTagIds);

    const handleSelect = (selected: number) => void setLocalValue(previous => toggleFilterSelection(previous, [selected]));
    const handleSelectAll = () => void setLocalValue(() => (tags ?? []).map(tag => tag.id));
    const handleApply = () => void resolveTransactionTagFilter({ value: localValueRef.current });
    const handleClose = () => void resolveTransactionTagFilter(null);

    const applyLabel = t({
        message: plural(selectedCount, {
            0: 'Show all tags',
            one: 'Show # tag',
            other: 'Show # tags'
        })
    });

    return (
        <FilterSheet>
            <TransactionFilterSelectorHeader title={t`Filter tags`} onClose={handleClose} />

            <TagsSelectContent
                data={data}
                selectedTagIds={selectedTagIds}
                isLoading={isLoading}
                additionalBottomPadding={FOOTER_BOTTOM_SPACE}
                topOffset={LIST_TOP_SPACE}
                onSelect={handleSelect}
            />

            <TransactionFilterSelectorFooter
                searchValue={search}
                searchPlaceholder={t`Search tags...`}
                onSearchChange={setSearch}
                isLoading={isLoading}
                selectedCount={selectedCount}
                applyLabel={applyLabel}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onApply={handleApply}
                searchTestID={TransactionFiltersSelector.TagSearchInput}
                selectAllTestID={TransactionFiltersSelector.TagSelectAllButton}
                deselectAllTestID={TransactionFiltersSelector.TagDeselectAllButton}
                applyTestID={TransactionFiltersSelector.TagApplyButton}
            />
        </FilterSheet>
    );
}
