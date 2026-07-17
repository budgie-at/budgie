import { mergeRefs, mergeScrollContentInset, useScreenChrome, useScreenChromeScrollHandler } from '@budgie/screen-chrome';
import { ComponentProps, ReactNode, Ref } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

interface Props extends ComponentProps<typeof KeyboardAwareScrollView> {
    readonly contentInsetTop?: number;
    readonly contentInsetBottom?: number;
    readonly ref?: Ref<KeyboardAwareScrollViewRef>;
}

const AnimatedKeyboardAwareScrollView = Animated.createAnimatedComponent(KeyboardAwareScrollView);

export const ChromeKeyboardScrollView = ({
    contentInsetTop = 0,
    contentInsetBottom = 0,
    contentContainerStyle,
    bottomOffset = 0,
    ref,
    ...scrollViewProps
}: Props): ReactNode => {
    const { config, scrollRef } = useScreenChrome();
    const insets = useSafeAreaInsets();
    const onScroll = useScreenChromeScrollHandler();
    const mergedRef = mergeRefs(scrollRef, ref);
    const mergedContentContainerStyle = mergeScrollContentInset(insets, contentInsetTop, contentInsetBottom, contentContainerStyle);

    return (
        <AnimatedKeyboardAwareScrollView
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            {...scrollViewProps}
            ref={mergedRef}
            bottomOffset={bottomOffset}
            contentContainerStyle={mergedContentContainerStyle}
            onScroll={onScroll}
            scrollEventThrottle={config.scrollEventThrottle}
        />
    );
};
