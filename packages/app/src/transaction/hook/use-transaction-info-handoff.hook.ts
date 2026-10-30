import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, { scrollTo, useAnimatedRef, useAnimatedScrollHandler, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_INFO_HANDOFF_DISTANCE } from '../constant/transaction-info-handoff-distance.constant';
import { TRANSACTION_INFO_SCROLL_BOTTOM_INSET } from '../constant/transaction-info-scroll-bottom-inset.constant';

import type { LayoutChangeEvent } from 'react-native';

const SETTLE_FRAME_COUNT = 3;

export const useTransactionInfoHandoff = () => {
    const { height } = useWindowDimensions();
    const { top, bottom } = useSafeAreaInsets();
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const isDragging = useSharedValue(false);
    const animated = !useReducedMotion();
    const [revealOffset, setRevealOffset] = useState(0);
    const [fadeEnd, setFadeEnd] = useState(0);
    const [contentHeight, setContentHeight] = useState(Number.MAX_SAFE_INTEGER);
    const settledOffset = Math.max(revealOffset, fadeEnd) + TRANSACTION_INFO_HANDOFF_DISTANCE;
    const fitsScreen = top + config.headerHeight + contentHeight + TRANSACTION_INFO_SCROLL_BOTTOM_INSET + bottom <= height;

    const handleScrollEnd = useAnimatedScrollHandler(
        {
            onBeginDrag: () => {
                isDragging.set(true);
            },
            onEndDrag: event => {
                isDragging.set(false);
                let settledY = event.contentOffset.y;
                let stableFrames = 0;
                const snapWhenSettled = () => {
                    if (isDragging.get()) {
                        return;
                    }

                    if (scrollY.get() !== settledY || stableFrames < SETTLE_FRAME_COUNT) {
                        stableFrames = scrollY.get() === settledY ? stableFrames + 1 : 0;
                        settledY = scrollY.get();
                        requestAnimationFrame(snapWhenSettled);

                        return;
                    }

                    if (settledY > 0 && settledY < settledOffset) {
                        scrollTo(scrollRef, 0, settledY < settledOffset / 2 || fitsScreen ? 0 : settledOffset, animated);
                    }
                };

                requestAnimationFrame(snapWhenSettled);
            }
        },
        [settledOffset, fitsScreen, animated]
    );

    return {
        minimumHeight: fitsScreen ? 0 : height + settledOffset,
        revealOffset,
        onEndLayout: (event: LayoutChangeEvent) => void setFadeEnd(current => Math.max(current, event.nativeEvent.layout.y)),
        onAmountLayout: (event: LayoutChangeEvent) => void setRevealOffset(Math.max(0, event.nativeEvent.layout.y)),
        onContentLayout: (event: LayoutChangeEvent) => void setContentHeight(event.nativeEvent.layout.height),
        scrollRef,
        handleScrollEnd
    };
};
