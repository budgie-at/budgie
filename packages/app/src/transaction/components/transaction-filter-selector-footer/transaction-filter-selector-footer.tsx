import { View } from 'react-native';
import { KeyboardStickyView, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
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
const KEYBOARD_OPENED_OFFSET = 20;
const KEYBOARD_OPEN_BOTTOM_SPACING = 6;
const ACTION_ROW_HEIGHT = 52;
const ACTION_ROW_TOP_SPACING = 12;
const ACTION_ROW_HIDDEN_TRANSLATE_Y = 12;
const SEARCH_ROW_KEYBOARD_TRANSLATE_Y = 48;
const keyboardOffset = { closed: 0, opened: KEYBOARD_OPENED_OFFSET };

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
    const { progress } = useReanimatedKeyboardAnimation();

    const hasSelection = isPositiveNumber(selectedCount);
    const bulkToggleDisabled = isLoading && !hasSelection;
    const closedBottomSpacing = Math.max(bottom, MIN_BOTTOM_SPACING);
    const style = {
        backgroundColor
    };
    const footerStyle = useAnimatedStyle(() => ({
        paddingBottom: interpolate(progress.value, [0, 1], [closedBottomSpacing, KEYBOARD_OPEN_BOTTOM_SPACING])
    }));
    const footerStyles = [style, footerStyle];
    const searchRowStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(progress.value, [0, 1], [0, SEARCH_ROW_KEYBOARD_TRANSLATE_Y]) }]
    }));
    const actionsStyle = useAnimatedStyle(() => ({
        height: interpolate(progress.value, [0, 1], [ACTION_ROW_HEIGHT, 0]),
        marginTop: interpolate(progress.value, [0, 1], [ACTION_ROW_TOP_SPACING, 0]),
        opacity: 1 - progress.value,
        transform: [{ translateY: interpolate(progress.value, [0, 1], [0, ACTION_ROW_HIDDEN_TRANSLATE_Y]) }]
    }));

    return (
        <KeyboardStickyView offset={keyboardOffset} className="absolute inset-x-0 bottom-0">
            <Animated.View className="border-t border-t-secondary-corner px-xl pt-lg" style={footerStyles}>
                <Animated.View style={searchRowStyle}>
                    <SelectorSearchRow
                        search={searchValue}
                        onSearchChange={onSearchChange}
                        placeholder={searchPlaceholder}
                        testID={searchTestID}
                    />
                </Animated.View>
                <Animated.View className="overflow-hidden" style={actionsStyle} pointerEvents="box-none">
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
                </Animated.View>
            </Animated.View>
        </KeyboardStickyView>
    );
};
