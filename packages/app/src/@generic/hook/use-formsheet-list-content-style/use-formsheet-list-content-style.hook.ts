import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SELECTOR_HEADER_OFFSET } from '../../constant/selector-header-offset.constant';

const HORIZONTAL_PADDING = 16;
const BOTTOM_CLEARANCE = 16;

export const useFormsheetListContentStyle = (additionalBottomPadding = 0, topOffset = SELECTOR_HEADER_OFFSET, columnGap = 0): ViewStyle => {
    const { bottom } = useSafeAreaInsets();

    return {
        paddingTop: topOffset,
        paddingBottom: bottom + BOTTOM_CLEARANCE + additionalBottomPadding,
        paddingHorizontal: HORIZONTAL_PADDING + columnGap / 2,
        flexGrow: 1
    };
};
