import { View } from 'react-native';

import { EmptyFn, isPositiveNumber } from '@rnw-community/shared';

import { SearchInput } from '../../search-input/search-input';
import { FilterSheetApply } from '../filter-sheet-apply/filter-sheet-apply';
import { FilterSheetBulkToggle } from '../filter-sheet-bulk-toggle/filter-sheet-bulk-toggle';
import { FilterSheetDrawer } from '../filter-sheet-drawer/filter-sheet-drawer';

interface Props {
    readonly showControls: boolean;
    readonly searchValue: string;
    readonly searchPlaceholder: string;
    readonly onSearchChange: (value: string) => void;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
    readonly onApply: EmptyFn;
    readonly applyLabel: string;
    readonly selectedCount: number;
    readonly isLoading?: boolean;
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
        applyLabel,
        selectedCount,
        isLoading = false,
        searchTestID,
        selectAllTestID,
        deselectAllTestID,
        applyTestID
    } = props;

    const showSearch = showControls || isLoading;
    const bulkToggleDisabled = isLoading && !isPositiveNumber(selectedCount);

    return (
        <FilterSheetDrawer>
            {showSearch ? (
                <SearchInput
                    containerClassName="h-[44px]"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChangeText={onSearchChange}
                    testID={searchTestID}
                />
            ) : null}
            <View className="flex-row items-center gap-x-md">
                {showSearch ? (
                    <FilterSheetBulkToggle
                        disabled={bulkToggleDisabled}
                        selectedCount={selectedCount}
                        onSelectAll={onSelectAll}
                        onDeselectAll={onDeselectAll}
                        selectAllTestID={selectAllTestID}
                        deselectAllTestID={deselectAllTestID}
                    />
                ) : null}
                <FilterSheetApply onApply={onApply} label={applyLabel} testID={applyTestID} />
            </View>
        </FilterSheetDrawer>
    );
};
