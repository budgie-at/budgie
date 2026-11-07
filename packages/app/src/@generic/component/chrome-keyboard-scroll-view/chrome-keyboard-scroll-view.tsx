import { useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addScrollContentInset, mergeRefs, useBottomChromeInset, useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { useCollapsibleChromeScroll } from '../../hook/use-collapsible-chrome-scroll.hook';

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
    contentInsetBottom,
    contentContainerStyle,
    bottomOffset,
    ref,
    ...scrollViewProps
}: Props): ReactNode => {
    const { config } = useScreenChrome();
    const { chromeHeight, inset } = useBottomChromeInset();
    const { onScroll, scrollRef } = useCollapsibleChromeScroll();
    const insets = useSafeAreaInsets();
    const mergedRef = mergeRefs(scrollRef, ref);
    const { height } = useWindowDimensions();
    const snapRangeStyle = config.snapToCollapse ? { minHeight: height + config.collapseEnd } : null;
    const resolvedContentInsetBottom = isDefined(contentInsetBottom) ? contentInsetBottom : chromeHeight;
    const resolvedBottomOffset = isDefined(bottomOffset) ? bottomOffset : inset;
    const mergedContentContainerStyle = addScrollContentInset(insets, contentInsetTop, resolvedContentInsetBottom, [
        snapRangeStyle,
        contentContainerStyle
    ]);

    return (
        <AnimatedKeyboardAwareScrollView
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            {...scrollViewProps}
            ref={mergedRef}
            bottomOffset={resolvedBottomOffset}
            contentContainerStyle={mergedContentContainerStyle}
            onScroll={onScroll}
            scrollEventThrottle={config.scrollEventThrottle}
        />
    );
};
