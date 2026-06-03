import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isPositiveNumber } from '@rnw-community/shared';

import { FilterSheetApply } from '../../../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetBulkToggle } from '../../../@generic/component/filter-sheet/filter-sheet-bulk-toggle/filter-sheet-bulk-toggle';
import { SelectorSearchRow } from '../../../@generic/component/selector-search-row/selector-search-row';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

interface Props {
    readonly searchValue: string;
    readonly searchPlaceholder: string;
    readonly onSearchChange: (value: string) => void;
    readonly selectedCount: number;
    readonly applyLabel: string;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
    readonly onApply: EmptyFn;
    readonly isLoading?: boolean;
    readonly searchTestID?: string;
    readonly selectAllTestID?: string;
    readonly deselectAllTestID?: string;
    readonly applyTestID?: string;
}

const MIN_BOTTOM_SPACING = 16;

export const TransactionFilterSelectorFooter = (props: Props) => {
    const {
        searchValue,
        searchPlaceholder,
        onSearchChange,
        selectedCount,
        applyLabel,
        onSelectAll,
        onDeselectAll,
        onApply,
        isLoading = false,
        searchTestID,
        selectAllTestID,
        deselectAllTestID,
        applyTestID
    } = props;
    const { bottom } = useSafeAreaInsets();
    const { backgroundColor } = useFormsheetListStyles();

    const hasSelection = isPositiveNumber(selectedCount);
    const bulkToggleDisabled = isLoading && !hasSelection;
    const style = {
        backgroundColor,
        paddingBottom: Math.max(bottom, MIN_BOTTOM_SPACING)
    };

    return (
        <View className="absolute inset-x-0 bottom-0 gap-y-md border-t border-t-secondary-corner px-xl pt-lg" style={style}>
            <SelectorSearchRow search={searchValue} onSearchChange={onSearchChange} placeholder={searchPlaceholder} testID={searchTestID} />
            <View className="flex-row items-center gap-x-md">
                <FilterSheetBulkToggle
                    disabled={bulkToggleDisabled}
                    selectedCount={selectedCount}
                    onSelectAll={onSelectAll}
                    onDeselectAll={onDeselectAll}
                    selectAllTestID={selectAllTestID}
                    deselectAllTestID={deselectAllTestID}
                />
                <FilterSheetApply onApply={onApply} label={applyLabel} testID={applyTestID} />
            </View>
        </View>
    );
};
