import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedReaction, useAnimatedRef, useScrollOffset } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { mergeRefs } from '../../utils/merge-refs.util';
import { mergeScrollContentInset } from '../../utils/merge-scroll-content-inset.util';

import type { ComponentProps, ReactNode, Ref } from 'react';
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
    const { config } = useScreenChrome();
    const { onScroll, scrollRef, scrollY } = useCollapsibleHeaderScroll();
    const insets = useSafeAreaInsets();
    const nativeScrollRef = useAnimatedRef<Animated.ScrollView>();
    const nativeScrollOffset = useScrollOffset(nativeScrollRef);
    const mergedRef = mergeRefs(nativeScrollRef, scrollRef, ref);
    const mergedContentContainerStyle = mergeScrollContentInset(insets, contentInsetTop, contentInsetBottom, contentContainerStyle);

    useAnimatedReaction(
        () => nativeScrollOffset.get(),
        offset => {
            scrollY.set(offset);
        }
    );

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
