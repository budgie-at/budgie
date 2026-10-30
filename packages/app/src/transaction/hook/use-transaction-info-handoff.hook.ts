import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
    scrollTo,
    useAnimatedReaction,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useReducedMotion,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_INFO_SCROLL_BOTTOM_INSET } from '../constant/transaction-info-scroll-bottom-inset.constant';

import { useTransactionInfoHeroHandoff } from './use-transaction-info-hero-handoff.hook';

import type { LayoutChangeEvent } from 'react-native';

const SETTLE_FRAME_COUNT = 3;
const SETTLED_CONTENT_GAP = 12;
const SNAP_MAX_VELOCITY = 0.4;
const STALE_VELOCITY_MS = 60;

export const useTransactionInfoHandoff = () => {
    const { height } = useWindowDimensions();
    const { top, bottom } = useSafeAreaInsets();
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const drag = useSharedValue({ isDragging: false, lastY: 0, sampledAt: 0, direction: 0, velocity: 0 });
    const animated = !useReducedMotion();
    const [bodyTop, setBodyTop] = useState(0);
    const heroHandoff = useTransactionInfoHeroHandoff(animated, bodyTop);
    const [contentHeight, setContentHeight] = useState(Number.MAX_SAFE_INTEGER);
    const settledOffset = Math.max(bodyTop - SETTLED_CONTENT_GAP, 0);
    const fitsScreen = top + config.headerHeight + contentHeight + TRANSACTION_INFO_SCROLL_BOTTOM_INSET + bottom <= height;

    useAnimatedReaction(
        () => scrollY.get(),
        current => {
            const state = drag.get();

            if (!state.isDragging || current === state.lastY) {
                return;
            }

            const now = Date.now();
            const delta = current - state.lastY;

            drag.set({
                ...state,
                lastY: current,
                sampledAt: now,
                direction: Math.sign(delta),
                velocity: delta / Math.max(now - state.sampledAt, 1)
            });
        }
    );

    const handleScrollEnd = useAnimatedScrollHandler(
        {
            onBeginDrag: () => {
                drag.set({ isDragging: true, lastY: scrollY.get(), sampledAt: Date.now(), direction: 0, velocity: 0 });
            },
            onEndDrag: () => {
                const state = { ...drag.get(), isDragging: false };
                const releasedY = scrollY.get();
                const releaseVelocity = Date.now() - state.sampledAt > STALE_VELOCITY_MS ? 0 : Math.abs(state.velocity);

                drag.set(state);

                if (releasedY <= 0 || releasedY >= settledOffset || releaseVelocity > SNAP_MAX_VELOCITY) {
                    return;
                }

                const collapses = !fitsScreen && (state.direction === 0 ? releasedY > settledOffset / 2 : state.direction > 0);
                let settledY = releasedY;
                let stableFrames = 0;
                const snapWhenSettled = () => {
                    if (drag.get().isDragging) {
                        return;
                    }

                    if (scrollY.get() !== settledY || stableFrames < SETTLE_FRAME_COUNT) {
                        stableFrames = scrollY.get() === settledY ? stableFrames + 1 : 0;
                        settledY = scrollY.get();
                        requestAnimationFrame(snapWhenSettled);

                        return;
                    }

                    if (settledY > 0 && settledY < settledOffset) {
                        scrollTo(scrollRef, 0, collapses ? settledOffset : 0, animated);
                    }
                };

                requestAnimationFrame(snapWhenSettled);
            }
        },
        [settledOffset, fitsScreen, animated]
    );

    return {
        minimumHeight: fitsScreen ? 0 : height + settledOffset,
        ...heroHandoff,
        onBodyLayout: (event: LayoutChangeEvent) => void setBodyTop(event.nativeEvent.layout.y),
        onContentLayout: (event: LayoutChangeEvent) => void setContentHeight(event.nativeEvent.layout.height),
        scrollRef,
        handleScrollEnd
    };
};
