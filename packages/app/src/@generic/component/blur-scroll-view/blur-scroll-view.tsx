import { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { BLUR_CONTENT_PADDING_STYLE } from '../../constant/blur-content-padding.constant';

type Props = ComponentProps<typeof KeyboardAwareScrollView>;

export const BlurScrollView = ({ contentContainerStyle, ...props }: Props) => {
    const mergedStyle = StyleSheet.flatten([BLUR_CONTENT_PADDING_STYLE, contentContainerStyle]);

    return (
        <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...props}
            contentContainerStyle={mergedStyle}
        />
    );
};
