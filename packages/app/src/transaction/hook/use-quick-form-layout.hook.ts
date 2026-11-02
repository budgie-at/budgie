import { useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getTransactionKeypadLayout } from '../utils/get-transaction-keypad-layout.util';

const HERO_VERTICAL_SPACING = 32;

export const useQuickFormLayout = () => {
    const { fontScale } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [height, setHeight] = useState(0);
    const [heroHeight, setHeroHeight] = useState(0);
    const [fieldsHeight, setFieldsHeight] = useState(0);
    const { keypadStyle } = getTransactionKeypadLayout(fontScale);
    const bottomPadding = Math.max(insets.bottom, 8) + 8 - insets.bottom;
    const footerHeight = Math.min(
        keypadStyle.maxHeight,
        Math.max(keypadStyle.minHeight, height - heroHeight - fieldsHeight - HERO_VERTICAL_SPACING - 12 - bottomPadding)
    );
    const upperHeight = Math.max(0, height - footerHeight - 12 - bottomPadding);
    const overflows = heroHeight + fieldsHeight + HERO_VERTICAL_SPACING > upperHeight;
    const handleLayout = (event: LayoutChangeEvent) => void setHeight(event.nativeEvent.layout.height);
    const handleHeroLayout = (event: LayoutChangeEvent) => void setHeroHeight(event.nativeEvent.layout.height);
    const handleFieldsLayout = (event: LayoutChangeEvent) => void setFieldsHeight(event.nativeEvent.layout.height);

    return {
        handleLayout,
        handleHeroLayout,
        handleFieldsLayout,
        overflows,
        bottomPadding,
        footerHeight,
        keypadContainerStyle: { height: footerHeight },
        footerStyle: { height: footerHeight + bottomPadding, paddingBottom: bottomPadding },
        contentStyle: { minHeight: upperHeight }
    };
};
