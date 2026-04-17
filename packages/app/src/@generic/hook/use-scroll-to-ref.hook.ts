import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Dimensions, LayoutChangeEvent, ScrollView, ViewStyle } from 'react-native';
import { AnimatedStyle, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { emptyFn, isDefined } from '@rnw-community/shared';

const SCROLL_DELAY_MS = 300;
const FADE_IN_MS = 200;
const HOLD_MS = 600;
const FADE_OUT_MS = 400;
const CENTER_DIVISOR = 2;
const HIGHLIGHT_BORDER_RADIUS = 16;
const HIGHLIGHT_PADDING = 8;
const HIGHLIGHT_OPACITY = 0.08;

interface LayoutPosition {
    readonly y: number;
    readonly height: number;
}

interface AnchorLayoutProps {
    readonly onLayout: (event: LayoutChangeEvent) => void;
}

interface AnchorStyleProps {
    readonly style: AnimatedStyle<ViewStyle>;
}

export const useScrollToRef = () => {
    const { anchor } = useLocalSearchParams<{ anchor?: string }>();
    const scrollViewInstance = useRef<ScrollView | null>(null);
    const positions = useRef<Map<string, LayoutPosition>>(new Map());
    const highlightProgress = useSharedValue(0);

    const scrollViewRef = (node: ScrollView | null): void => {
        scrollViewInstance.current = node;
    };

    useEffect(() => {
        if (!isDefined(anchor)) {
            return emptyFn;
        }

        const timer = setTimeout(() => {
            const scrollView = scrollViewInstance.current;
            const position = positions.current.get(anchor);
            if (!isDefined(scrollView) || !isDefined(position)) {
                return;
            }

            const windowHeight = Dimensions.get('window').height;
            const centeredY = position.y - windowHeight / CENTER_DIVISOR + position.height / CENTER_DIVISOR;

            scrollView.scrollTo({ y: Math.max(0, centeredY), animated: true });
            highlightProgress.value = withSequence(
                withTiming(1, { duration: FADE_IN_MS }),
                withDelay(HOLD_MS, withTiming(0, { duration: FADE_OUT_MS }))
            );
        }, SCROLL_DELAY_MS);

        return () => {
            clearTimeout(timer);
        };
    }, [anchor, highlightProgress]);

    const highlightStyle = useAnimatedStyle(() => ({
        borderRadius: HIGHLIGHT_BORDER_RADIUS,
        padding: HIGHLIGHT_PADDING,
        backgroundColor: `rgba(120, 170, 255, ${interpolate(highlightProgress.value, [0, 1], [0, HIGHLIGHT_OPACITY])})`
    }));

    const emptyStyle = useAnimatedStyle(() => ({}));

    const anchorLayout = (name: string): AnchorLayoutProps => ({
        onLayout: (event: LayoutChangeEvent) => {
            const { y, height } = event.nativeEvent.layout;
            positions.current.set(name, { y, height });
        }
    });

    const anchorHighlight = (name: string): AnchorStyleProps => ({
        style: anchor === name ? highlightStyle : emptyStyle
    });

    return { scrollViewRef, anchorLayout, anchorHighlight };
};
