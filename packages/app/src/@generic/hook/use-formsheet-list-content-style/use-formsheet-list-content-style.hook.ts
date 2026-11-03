import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HORIZONTAL_PADDING = 16;
const BOTTOM_CLEARANCE = 16;

export const useFormsheetListContentStyle = (additionalBottomPadding = 0, topOffset = 16): ViewStyle => {
    const { bottom } = useSafeAreaInsets();

    return {
        paddingTop: topOffset,
        paddingBottom: bottom + BOTTOM_CLEARANCE + additionalBottomPadding,
        paddingHorizontal: HORIZONTAL_PADDING,
        flexGrow: 1
    };
};
