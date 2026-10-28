import { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterSheetApply } from '../../../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { SelectorSearchRow } from '../../../@generic/component/selector-search-row/selector-search-row';

interface Props {
    readonly searchValue: string;
    readonly searchPlaceholder: string;
    readonly onSearchChange: (value: string) => void;
    readonly searchTestID?: string;
    readonly applyLabel: string;
    readonly onApply: () => void;
    readonly applyTestID?: string;
    readonly children: ReactNode;
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
    const { searchValue, searchPlaceholder, onSearchChange, searchTestID, applyLabel, onApply, applyTestID, children } = props;
    const { bottom } = useSafeAreaInsets();
    const { progress } = useReanimatedKeyboardAnimation();
    const closedBottomSpacing = Math.max(bottom, MIN_BOTTOM_SPACING);
    const footerStyle = useAnimatedStyle(() => ({
        paddingBottom: interpolate(progress.value, [0, 1], [closedBottomSpacing, KEYBOARD_OPEN_BOTTOM_SPACING])
    }));
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
            <Animated.View className="border-t border-t-secondary-corner bg-primary-reverse px-xl pt-lg" style={footerStyle}>
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
                        {children}
                        <FilterSheetApply onApply={onApply} label={applyLabel} testID={applyTestID} />
                    </View>
                </Animated.View>
            </Animated.View>
        </KeyboardStickyView>
    );
};
