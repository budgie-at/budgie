import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_OFFSET = 88;
const HORIZONTAL_PADDING = 12;

export const useFormsheetListContentStyle = (additionalBottomPadding = 0, topOffset = HEADER_OFFSET): ViewStyle => {
    const { bottom } = useSafeAreaInsets();

    return {
        paddingTop: topOffset,
        paddingBottom: bottom + additionalBottomPadding,
        paddingHorizontal: HORIZONTAL_PADDING,
        flexGrow: 1
    };
};
