import { EmptyFn } from '@rnw-community/shared';

import { Input } from '../input/input';

import { FilterSheetApply } from './filter-sheet-apply';
import { FilterSheetBulkActions } from './filter-sheet-bulk-actions';
import { FilterSheetDrawer } from './filter-sheet-drawer';

interface Props {
    readonly showControls: boolean;
    readonly searchValue: string;
    readonly searchPlaceholder: string;
    readonly onSearchChange: (value: string) => void;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
    readonly onApply: EmptyFn;
    readonly selectedCount: number;
    readonly searchTestID?: string;
    readonly selectAllTestID?: string;
    readonly deselectAllTestID?: string;
    readonly applyTestID?: string;
}

export const FilterSheetSearchableDrawer = (props: Props) => {
    const {
        showControls,
        searchValue,
        searchPlaceholder,
        onSearchChange,
        onSelectAll,
        onDeselectAll,
        onApply,
        selectedCount,
        searchTestID,
        selectAllTestID,
        deselectAllTestID,
        applyTestID
    } = props;

    return (
        <FilterSheetDrawer>
            {showControls ? (
                <>
                    <Input placeholder={searchPlaceholder} value={searchValue} onChangeText={onSearchChange} testID={searchTestID} />
                    <FilterSheetBulkActions
                        onSelectAll={onSelectAll}
                        onDeselectAll={onDeselectAll}
                        selectAllTestID={selectAllTestID}
                        deselectAllTestID={deselectAllTestID}
                    />
                </>
            ) : null}
            <FilterSheetApply onApply={onApply} selectedCount={selectedCount} testID={applyTestID} />
        </FilterSheetDrawer>
    );
};
