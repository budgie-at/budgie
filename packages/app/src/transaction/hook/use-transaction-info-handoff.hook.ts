import { useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

export const useTransactionInfoHandoff = () => {
    const { height } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const reducedMotion = useReducedMotion();
    const [revealOffset, setRevealOffset] = useState(0);
    const [fadeEnd, setFadeEnd] = useState(0);
    const settledOffset = Math.max(revealOffset + 20, fadeEnd);
    const onEndLayout = (event: LayoutChangeEvent) => void setFadeEnd(event.nativeEvent.layout.y);
    const onAmountLayout = (event: LayoutChangeEvent) => {
        setRevealOffset(Math.max(0, event.nativeEvent.layout.y));
    };

    const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.y;
        const collapsedOffset = settledOffset;

        if (offset > 0 && offset < collapsedOffset) {
            scrollRef.current?.scrollTo({ y: offset < collapsedOffset / 2 ? 0 : collapsedOffset, animated: !reducedMotion });
        }
    };

    return { minimumHeight: height + settledOffset, revealOffset, onEndLayout, onAmountLayout, scrollRef, handleScrollEnd };
};
