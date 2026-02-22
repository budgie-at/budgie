import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeContext } from '../../../theme/context/theme.context';

const HEADER_OFFSET = 88;
const HORIZONTAL_PADDING = 16;
const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

export const useFormsheetListStyles = () => {
    const { bottom } = useSafeAreaInsets();
    const { isDarkColorSchema } = useThemeContext();

    const backgroundColor = isDarkColorSchema ? BG_DARK : BG_LIGHT;

    return {
        flatListStyle: [StyleSheet.absoluteFill, { backgroundColor }],
        contentContainerStyle: { paddingTop: HEADER_OFFSET, paddingBottom: bottom, paddingHorizontal: HORIZONTAL_PADDING, flexGrow: 1 },
        backgroundColor
    };
};
