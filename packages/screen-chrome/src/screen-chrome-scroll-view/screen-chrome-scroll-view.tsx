import { ComponentProps, ReactNode, Ref, useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNumber } from '@rnw-community/shared';

import { useScreenChromeScrollHandler } from '../hook/use-screen-chrome-scroll-handler.hook';
import { useScreenChrome } from '../hook/use-screen-chrome.hook';
import { mergeRefs } from '../utils/merge-refs.util';

interface Props extends ComponentProps<typeof ScrollView> {
    readonly contentInsetTop?: number;
    readonly contentInsetBottom?: number;
    readonly ref?: Ref<Animated.ScrollView>;
}

export const ScreenChromeScrollView = ({
    contentInsetTop = 0,
    contentInsetBottom = 0,
    contentContainerStyle,
    ref,
    ...scrollViewProps
}: Props): ReactNode => {
    const { config, scrollRef } = useScreenChrome();
    const insets = useSafeAreaInsets();
    const onScroll = useScreenChromeScrollHandler();
    const mergedRef = useMemo(() => mergeRefs(scrollRef, ref), [scrollRef, ref]);

    const flattenedContentContainerStyle = StyleSheet.flatten(contentContainerStyle);
    const consumerPaddingTop =
        isDefined(flattenedContentContainerStyle) && isNumber(flattenedContentContainerStyle.paddingTop)
            ? flattenedContentContainerStyle.paddingTop
            : 0;
    const consumerPaddingBottom =
        isDefined(flattenedContentContainerStyle) && isNumber(flattenedContentContainerStyle.paddingBottom)
            ? flattenedContentContainerStyle.paddingBottom
            : 0;

    const mergedContentContainerStyle = {
        ...flattenedContentContainerStyle,
        paddingTop: insets.top + contentInsetTop + consumerPaddingTop,
        paddingBottom: insets.bottom + contentInsetBottom + consumerPaddingBottom
    };

    return (
        <Animated.ScrollView
            {...scrollViewProps}
            ref={mergedRef}
            contentContainerStyle={mergedContentContainerStyle}
            onScroll={onScroll}
            scrollEventThrottle={config.scrollEventThrottle}
        />
    );
};
