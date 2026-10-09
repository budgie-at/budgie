import { useEffect, useRef } from 'react';
import { LayoutChangeEvent, ScrollView, ViewStyle } from 'react-native';
import {
    AnimatedStyle,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

const FADE_IN_MS = 200;
const HOLD_MS = 600;
const FADE_OUT_MS = 400;
const HIGHLIGHT_BORDER_RADIUS = 16;
const HIGHLIGHT_PADDING = 8;
const HIGHLIGHT_OPACITY = 0.08;
const HIGHLIGHT_COLOR_TRANSPARENT = 'rgba(120, 170, 255, 0)';
const HIGHLIGHT_COLOR_ACTIVE = `rgba(120, 170, 255, ${HIGHLIGHT_OPACITY})`;

interface LayoutPositionInterface {
    readonly y: number;
    readonly height: number;
}

export const useScrollToAnchor = (activeAnchor: string | null | undefined) => {
    const scrollViewInstance = useRef<ScrollView | null>(null);
    const scrollViewHeight = useRef(0);
    const positions = useRef<Map<string, LayoutPositionInterface>>(new Map());
    const scrolledAnchor = useRef<string | null>(null);
    const highlightProgress = useSharedValue(0);

    const highlightStyle = useAnimatedStyle(() => ({
        borderRadius: HIGHLIGHT_BORDER_RADIUS,
        padding: HIGHLIGHT_PADDING,
        backgroundColor: interpolateColor(highlightProgress.value, [0, 1], [HIGHLIGHT_COLOR_TRANSPARENT, HIGHLIGHT_COLOR_ACTIVE])
    }));
    const emptyStyle = useAnimatedStyle(() => ({}));

    useEffect(() => {
        scrolledAnchor.current = null;
    }, [activeAnchor]);

    const scrollToActive = (): void => {
        if (!isDefined(activeAnchor) || scrolledAnchor.current === activeAnchor) {
            return;
        }

        const position = positions.current.get(activeAnchor);
        const scrollView = scrollViewInstance.current;
        const viewportHeight = scrollViewHeight.current;

        if (!isDefined(position) || !isDefined(scrollView) || viewportHeight === 0) {
            return;
        }

        const centeredY = position.y + position.height / 2 - viewportHeight / 2;

        scrollView.scrollTo({ y: Math.max(0, centeredY), animated: true });
        scrolledAnchor.current = activeAnchor;
        highlightProgress.set(
            withSequence(withTiming(1, { duration: FADE_IN_MS }), withDelay(HOLD_MS, withTiming(0, { duration: FADE_OUT_MS })))
        );
    };

    const scrollViewRef = (node: ScrollView | null): void => {
        scrollViewInstance.current = node;
    };

    const handleScrollViewLayout = (event: LayoutChangeEvent): void => {
        scrollViewHeight.current = event.nativeEvent.layout.height;
        scrollToActive();
    };

    const anchorLayout = (name: string): { readonly onLayout: (event: LayoutChangeEvent) => void } => ({
        onLayout: event => {
            const { y, height } = event.nativeEvent.layout;
            positions.current.set(name, { y, height });

            if (name === activeAnchor) {
                scrollToActive();
            }
        }
    });

    const anchorHighlight = (name: string): { readonly style: AnimatedStyle<ViewStyle> } => ({
        style: name === activeAnchor ? highlightStyle : emptyStyle
    });

    return { scrollViewRef, onScrollViewLayout: handleScrollViewLayout, anchorLayout, anchorHighlight };
};
