import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnchoredMorphOriginOffsetContext } from '../../context/anchored-morph-origin-offset.context';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const SheetWindowOffset = ({ children }: Props) => {
    const { height: windowHeight } = useWindowDimensions();
    const { bottom } = useSafeAreaInsets();
    const [sheetHeight, setSheetHeight] = useState(windowHeight);

    const handleLayout = (event: LayoutChangeEvent) => {
        setSheetHeight(event.nativeEvent.layout.height);
    };

    const offset = windowHeight - sheetHeight - bottom;

    return (
        <View onLayout={handleLayout}>
            <AnchoredMorphOriginOffsetContext value={offset}>{children}</AnchoredMorphOriginOffsetContext>
        </View>
    );
};
