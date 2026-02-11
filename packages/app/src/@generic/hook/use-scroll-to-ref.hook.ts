import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Dimensions, LayoutChangeEvent, ScrollView, ViewStyle } from 'react-native';
import {
    AnimatedStyle,
    Easing,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import { emptyFn, isDefined } from '@rnw-community/shared';

const SCROLL_DELAY_MS = 300;
const SCROLL_SETTLE_MS = 500;
const HIGHLIGHT_FADE_IN_MS = 300;
const HIGHLIGHT_HOLD_MS = 800;
const HIGHLIGHT_FADE_OUT_MS = 500;
const CENTER_DIVISOR = 2;
const HIGHLIGHT_BORDER_RADIUS = 16;
const HIGHLIGHT_COLOR = 'rgba(100, 160, 255, 0.08)';
const TRANSPARENT = 'transparent';

interface LayoutPosition {
    readonly y: number;
    readonly height: number;
}

interface AnchorProps {
    readonly onLayout: (event: LayoutChangeEvent) => void;
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

    const triggerHighlight = (): void => {
        highlightProgress.value = withDelay(
            SCROLL_SETTLE_MS,
            withSequence(
                withTiming(1, { duration: HIGHLIGHT_FADE_IN_MS, easing: Easing.out(Easing.cubic) }),
                withDelay(HIGHLIGHT_HOLD_MS, withTiming(0, { duration: HIGHLIGHT_FADE_OUT_MS, easing: Easing.in(Easing.cubic) }))
            )
        );
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
            triggerHighlight();
        }, SCROLL_DELAY_MS);

        return () => {
            clearTimeout(timer);
        };
    }, [anchor]);

    const highlightStyle = useAnimatedStyle(() => ({
        borderRadius: HIGHLIGHT_BORDER_RADIUS,
        backgroundColor: interpolateColor(highlightProgress.value, [0, 1], [TRANSPARENT, HIGHLIGHT_COLOR])
    }));

    const emptyStyle = useAnimatedStyle(() => ({}));

    const anchorProps = (name: string): AnchorProps => ({
        onLayout: (event: LayoutChangeEvent) => {
            const { y, height } = event.nativeEvent.layout;
            positions.current.set(name, { y, height });
        },
        style: anchor === name ? highlightStyle : emptyStyle
    });

    return { scrollViewRef, anchorProps };
};
