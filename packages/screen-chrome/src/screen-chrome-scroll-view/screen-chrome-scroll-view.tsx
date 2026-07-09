import { ComponentProps, ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNumber } from '@rnw-community/shared';

import { useScreenChromeScrollHandler } from '../hook/use-screen-chrome-scroll-handler.hook';
import { useScreenChrome } from '../hook/use-screen-chrome.hook';

interface Props extends ComponentProps<typeof ScrollView> {
    readonly contentInsetTop?: number;
    readonly contentInsetBottom?: number;
}

export const ScreenChromeScrollView = ({
    contentInsetTop = 0,
    contentInsetBottom = 0,
    contentContainerStyle,
    ...scrollViewProps
}: Props): ReactNode => {
    const { config, scrollRef } = useScreenChrome();
    const insets = useSafeAreaInsets();
    const onScroll = useScreenChromeScrollHandler();

    const flattenedContentContainerStyle = StyleSheet.flatten(contentContainerStyle);
    const consumerPaddingBottom =
        isDefined(flattenedContentContainerStyle) && isNumber(flattenedContentContainerStyle.paddingBottom)
            ? flattenedContentContainerStyle.paddingBottom
            : 0;

    const mergedContentContainerStyle = {
        ...flattenedContentContainerStyle,
        paddingTop: insets.top + contentInsetTop,
        paddingBottom: insets.bottom + contentInsetBottom + consumerPaddingBottom
    };

    return (
        <Animated.ScrollView
            {...scrollViewProps}
            ref={scrollRef}
            contentContainerStyle={mergedContentContainerStyle}
            onScroll={onScroll}
            scrollEventThrottle={config.scrollEventThrottle}
        />
    );
};
