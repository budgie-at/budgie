import { useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChromeScrollY, useScrollFadeStyle } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_LARGE_TEXT_SCALE } from '../constant/transaction-large-text-scale.constant';
import { getTransactionKeypadLayout } from '../utils/get-transaction-keypad-layout.util';

export const useQuickFormLayout = (hasKeypad: boolean) => {
    const { fontScale } = useWindowDimensions();
    const [height, setHeight] = useState(0);
    const [amountHeight, setAmountHeight] = useState(0);
    const [scrollMetrics, setScrollMetrics] = useState({ content: 0, viewport: 0 });
    const scrollY = useScreenChromeScrollY();
    const { requiresScrolling } = getTransactionKeypadLayout(fontScale, height === 0 ? Infinity : height - amountHeight);
    const maxScrollY = scrollMetrics.content - scrollMetrics.viewport;
    const topEdgeStyle = useScrollFadeStyle([0, 8], [0, 1]);
    const bottomEdgeStyle = useAnimatedStyle(() => ({ opacity: scrollY.get() < maxScrollY - 1 ? 1 : 0 }));

    const handleLayout = (event: LayoutChangeEvent) => void setHeight(event.nativeEvent.layout.height);
    const handleAmountLayout = (event: LayoutChangeEvent) => void setAmountHeight(event.nativeEvent.layout.height);
    const handleContentSizeChange = (_width: number, contentHeight: number) =>
        void setScrollMetrics(previous => ({ ...previous, content: contentHeight }));
    const handleScrollLayout = (event: LayoutChangeEvent) =>
        void setScrollMetrics(previous => ({ ...previous, viewport: event.nativeEvent.layout.height }));

    return {
        isScrollingLayout: requiresScrolling || (fontScale >= TRANSACTION_LARGE_TEXT_SCALE && !hasKeypad),
        topEdgeStyle,
        bottomEdgeStyle,
        handleLayout,
        handleAmountLayout,
        handleContentSizeChange,
        handleScrollLayout,
        isLoading: height === 0 || amountHeight === 0
    };
};
