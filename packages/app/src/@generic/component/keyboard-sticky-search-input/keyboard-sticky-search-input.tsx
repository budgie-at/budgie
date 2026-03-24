import { TextInput, View } from 'react-native';
import { KeyboardStickyView, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import { useThemeContext } from '../../../theme/context/theme.context';
import {
    PAGE_BACKGROUND_DARK,
    PAGE_BACKGROUND_LIGHT,
    SEARCH_INPUT_STYLE_OVERFLOW,
    SEARCH_INPUT_Z_INDEX
} from '../searchable-page/searchable-page.constant';

interface Props {
    readonly search: string;
    readonly placeholder: string;
    readonly onSearchChange: (search: string) => void;
    readonly inputBottom: number;
    readonly keyboardGap: number;
    readonly testID?: string;
}

const BORDER_CURVE_CONTINUOUS = 'continuous';

export const KeyboardStickySearchInput = ({ search, placeholder, onSearchChange, inputBottom, keyboardGap, testID }: Props) => {
    const { isDarkColorSchema } = useThemeContext();
    const pageBackgroundColor = isDarkColorSchema ? PAGE_BACKGROUND_DARK : PAGE_BACKGROUND_LIGHT;

    const inputStyle = { bottom: inputBottom, zIndex: SEARCH_INPUT_Z_INDEX, overflow: SEARCH_INPUT_STYLE_OVERFLOW };
    const keyboardOffset = { closed: 0, opened: inputBottom - keyboardGap };

    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
    const isKeyboardOpen = useDerivedValue(() => Math.abs(keyboardHeight.value) > 0);
    const keyboardBackgroundStyle = useAnimatedStyle(() => ({
        backgroundColor: pageBackgroundColor,
        borderCurve: BORDER_CURVE_CONTINUOUS,
        opacity: isKeyboardOpen.value ? 1 : 0
    }));

    return (
        <KeyboardStickyView offset={keyboardOffset} style={inputStyle} className="absolute inset-x-0">
            <View className="px-xl pt-md overflow-visible">
                <Animated.View
                    className="absolute inset-x-0 top-0 -bottom-[200px] rounded-t-5xl"
                    style={keyboardBackgroundStyle}
                    pointerEvents="none"
                />
                <TextInput
                    value={search}
                    onChangeText={onSearchChange}
                    placeholder={placeholder}
                    testID={testID}
                    className="text-primary placeholder:text-secondary-foreground h-[44px] px-xl bg-secondary-background rounded-5xl border border-secondary-corner"
                />
            </View>
        </KeyboardStickyView>
    );
};
