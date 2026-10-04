import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames } from 'uniwind';

const HEADER_OFFSET = 88;
const HORIZONTAL_PADDING = 12;

export const useFormsheetListStyles = (additionalBottomPadding = 0, topOffset = HEADER_OFFSET) => {
    const { bottom } = useSafeAreaInsets();
    const { backgroundColor } = useResolveClassNames('bg-primary-reverse');

    return {
        flatListStyle: [StyleSheet.absoluteFill, { backgroundColor }],
        contentContainerStyle: {
            paddingTop: topOffset,
            paddingBottom: bottom + additionalBottomPadding,
            paddingHorizontal: HORIZONTAL_PADDING,
            flexGrow: 1
        },
        backgroundColor
    };
};
