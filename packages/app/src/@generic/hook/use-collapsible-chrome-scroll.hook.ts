import { useEffect, useRef } from 'react';
import { scrollTo, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { emptyFn } from '@rnw-community/shared';

import { useCollapsibleChromeSearch } from '../context/collapsible-chrome-search.context';

import { useReducedMotion } from './use-reduced-motion.hook';

const MAXIMUM_SNAP_RELEASE_VELOCITY = 0.1;

export const useCollapsibleChromeScroll = (onDragStart: () => void = emptyFn) => {
    const { scrollY, scrollRef: scrollReference } = useCollapsibleHeaderScroll();
    const { config } = useScreenChrome();
    const { snapToCollapse, collapseStart, collapseEnd } = config;
    const previousScrollOffset = useSharedValue(0);
    const scrollDirection = useSharedValue(0);
    const animateSnap = !useReducedMotion();
    const { isSearchActive } = useCollapsibleChromeSearch();
    const wasSearchActive = useRef(isSearchActive);

    const onScroll = useAnimatedScrollHandler({
        onScroll: event => {
            const delta = event.contentOffset.y - previousScrollOffset.get();
            if (delta !== 0) {
                scrollDirection.set(Math.sign(delta));
            }
            previousScrollOffset.set(event.contentOffset.y);
            scrollY.set(event.contentOffset.y);
        },
        onBeginDrag: () => {
            scheduleOnRN(onDragStart);
            scrollDirection.set(0);
            previousScrollOffset.set(scrollY.get());
        },
        onEndDrag: event => {
            const offset = event.contentOffset.y;
            const velocity = event.velocity?.y ?? Number.POSITIVE_INFINITY;
            if (
                !snapToCollapse ||
                Math.abs(velocity) > MAXIMUM_SNAP_RELEASE_VELOCITY ||
                offset <= collapseStart ||
                offset >= collapseEnd ||
                scrollDirection.get() === 0
            ) {
                return;
            }
            scrollTo(scrollReference, 0, scrollDirection.get() > 0 ? collapseEnd : collapseStart, animateSnap);
        }
    });

    useEffect(() => {
        if (wasSearchActive.current === isSearchActive) {
            return;
        }
        wasSearchActive.current = isSearchActive;
        scheduleOnUI(() => {
            const isBelowCollapseEnd = isSearchActive ? scrollY.get() < collapseEnd : scrollY.get() <= collapseEnd;

            if (isBelowCollapseEnd) {
                scrollTo(scrollReference, 0, isSearchActive ? collapseEnd : 0, animateSnap);
            }
        });
    }, [isSearchActive, scrollY, scrollReference, collapseEnd, animateSnap]);

    return { onScroll, scrollRef: scrollReference };
};
