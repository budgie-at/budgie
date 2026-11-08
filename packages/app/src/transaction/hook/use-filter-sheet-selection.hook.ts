import { useMorphingSheetCommit } from '../../@generic/hook/use-morphing-sheet-commit.hook';
import { useSearchableFilterState } from '../../@generic/hook/use-searchable-filter-state/use-searchable-filter-state.hook';
import { toggleFilterSelection } from '../utils/toggle-filter-selection.util';

import type { TransactionIdsFilterResultInterface } from '../interface/transaction-ids-filter-result.interface';

export const useFilterSheetSelection = (initialValue: number[] | null, onCommit: (result: TransactionIdsFilterResultInterface) => void) => {
    const { localValue, setLocalValue, search, setSearch, selectedCount, handleDeselectAll } = useSearchableFilterState(initialValue);
    const commit = useMorphingSheetCommit(onCommit);

    const handleSelect = (...selectedIds: number[]) => void setLocalValue(previous => toggleFilterSelection(previous, selectedIds));
    const handleSelectAll = (selectedIds: number[]) => void setLocalValue(() => selectedIds);
    const handleApply = () => void commit({ value: localValue });

    return { localValue, search, setSearch, selectedCount, handleDeselectAll, handleSelect, handleSelectAll, handleApply };
};
