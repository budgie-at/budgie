import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { FilterSheetApply } from '../../../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetBulkToggle } from '../../../@generic/component/filter-sheet/filter-sheet-bulk-toggle/filter-sheet-bulk-toggle';
import { sortSelectedFirst } from '../../../@generic/utils/sort-selected-first.util';
import { TagsSelectContent } from '../../../tag/components/tags-select-content/tags-select-content';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';
import { useFilterSheetSelection } from '../../hook/use-filter-sheet-selection.hook';
import { TransactionFilterSelectionSheet } from '../transaction-filter-selection-sheet/transaction-filter-selection-sheet';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

import type { TransactionTagFilterResult } from '../../context/transaction-tag-filter-modal.context';

interface Props {
    readonly value: number[] | null;
    readonly onCommit: (result: TransactionTagFilterResult) => void;
}

export const TransactionTagFilterContent = ({ value, onCommit }: Props) => {
    const { t } = useLingui();
    const { localValue, search, setSearch, selectedCount, handleDeselectAll, handleSelect, handleSelectAll, handleApply } =
        useFilterSheetSelection(value, onCommit);
    const { tags, isLoading } = useSearchTagsQuery(search);

    const selectedTagIds = localValue ?? [];
    const tagIds = (tags ?? []).map(tag => tag.id);
    const data = sortSelectedFirst(tags ?? [], selectedTagIds);

    const handleSelectAllTags = () => void handleSelectAll(tagIds);

    const applyLabel = t({
        message: plural(selectedCount, {
            0: 'Show all tags',
            one: 'Show # tag',
            other: 'Show # tags'
        })
    });

    return (
        <TransactionFilterSelectionSheet
            title={t`Filter tags`}
            searchPlaceholder={t`Search tags...`}
            searchValue={search}
            onSearchChange={setSearch}
            searchTestID={TransactionFiltersSelector.TagSearchInput}
            apply={<FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelector.TagApplyButton} />}
            bulkToggle={
                <FilterSheetBulkToggle
                    isLoading={isLoading}
                    selectedCount={selectedCount}
                    onSelectAll={handleSelectAllTags}
                    onDeselectAll={handleDeselectAll}
                    selectAllTestID={TransactionFiltersSelector.TagSelectAllButton}
                    deselectAllTestID={TransactionFiltersSelector.TagDeselectAllButton}
                />
            }
        >
            <TagsSelectContent data={data} selectedTagIds={selectedTagIds} isLoading={isLoading} onSelect={handleSelect} />
        </TransactionFilterSelectionSheet>
    );
};
