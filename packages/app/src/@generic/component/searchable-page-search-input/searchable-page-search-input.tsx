import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';
import { KeyboardStickySearchInput } from '../keyboard-sticky-search-input/keyboard-sticky-search-input';
import {
    SEARCH_SCRIM_EXTENT,
    SEARCH_BLUR_Z_INDEX,
    SEARCH_INPUT_VERTICAL_OFFSET,
    SEARCH_KEYBOARD_GAP
} from '../searchable-page/searchable-page.constant';

interface Props {
    readonly search: string;
    readonly placeholder: string;
    readonly onSearchChange: (search: string) => void;
    readonly testID?: string;
}

export const SearchablePageSearchInput = ({ search, placeholder, onSearchChange, testID }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const searchInputBottom = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom - SEARCH_INPUT_VERTICAL_OFFSET;
    const searchBlurStyle = { bottom: 0, height: searchInputBottom + SEARCH_SCRIM_EXTENT, zIndex: SEARCH_BLUR_Z_INDEX };

    return (
        <>
            <View className="absolute inset-x-0" style={searchBlurStyle} pointerEvents="none">
                <View className="h-[20px] bg-linear-to-b from-surface/0 to-surface" />
                <View className="flex-1 bg-surface" />
            </View>
            <KeyboardStickySearchInput
                search={search}
                placeholder={placeholder}
                onSearchChange={onSearchChange}
                inputBottom={searchInputBottom}
                keyboardGap={SEARCH_KEYBOARD_GAP}
                testID={testID}
            />
        </>
    );
};
