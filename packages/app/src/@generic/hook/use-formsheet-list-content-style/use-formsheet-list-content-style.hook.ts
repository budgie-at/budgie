import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SELECTOR_HEADER_OFFSET } from '../../constant/selector-header-offset.constant';

const HORIZONTAL_PADDING = 12;

export const useFormsheetListContentStyle = (additionalBottomPadding = 0, topOffset = SELECTOR_HEADER_OFFSET): ViewStyle => {
    const { bottom } = useSafeAreaInsets();

    return {
        paddingTop: topOffset,
        paddingBottom: bottom + additionalBottomPadding,
        paddingHorizontal: HORIZONTAL_PADDING,
        flexGrow: 1
    };
};
