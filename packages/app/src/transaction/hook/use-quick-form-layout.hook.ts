import { useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions } from 'react-native';

import { getTransactionKeypadLayout } from '../utils/get-transaction-keypad-layout.util';

export const useQuickFormLayout = () => {
    const { fontScale } = useWindowDimensions();
    const [height, setHeight] = useState(0);
    const [amountHeight, setAmountHeight] = useState(0);
    const { requiresScrolling } = getTransactionKeypadLayout(fontScale, height === 0 ? Infinity : height - amountHeight);
    const handleLayout = (event: LayoutChangeEvent) => void setHeight(event.nativeEvent.layout.height);
    const handleAmountLayout = (event: LayoutChangeEvent) => void setAmountHeight(event.nativeEvent.layout.height);

    return {
        isScrollingLayout: requiresScrolling,
        handleLayout,
        handleAmountLayout,
        isLoading: height === 0 || amountHeight === 0
    };
};
