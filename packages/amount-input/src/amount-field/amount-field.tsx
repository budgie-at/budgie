import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AmountFieldContext } from '../context/amount-field.context';
import { getFittedFontSize } from '../utils/get-fitted-font-size/get-fitted-font-size.util';

import type { AmountFieldPropsInterface } from '../interface/amount-field-props.interface';
import type { LayoutChangeEvent } from 'react-native';

const DEFAULT_MINIMUM_FONT_SCALE = 0.3;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        overflow: 'hidden'
    }
});

export const AmountField = ({
    fontSize: baseFontSize,
    minimumFontScale = DEFAULT_MINIMUM_FONT_SCALE,
    children,
    ...viewProps
}: AmountFieldPropsInterface) => {
    const [availableWidth, setAvailableWidth] = useState(0);
    const [partWidths, setPartWidths] = useState<Readonly<Record<string, number>>>({});
    const measuredWidth = Object.values(partWidths).reduce((total, width) => total + width, 0);
    const fontSize = getFittedFontSize(baseFontSize, minimumFontScale, availableWidth, measuredWidth);

    const setPartWidth = (partId: string, width: number | null) =>
        void setPartWidths(currentWidths => {
            if (currentWidths[partId] === width) {
                return currentWidths;
            }

            const otherWidths = Object.fromEntries(Object.entries(currentWidths).filter(([currentPartId]) => currentPartId !== partId));

            return isDefined(width) ? { ...otherWidths, [partId]: width } : otherWidths;
        });

    const handleLayout = (event: LayoutChangeEvent) => void setAvailableWidth(event.nativeEvent.layout.width);

    const contextValue = { fontSize, baseFontSize, setPartWidth };

    return (
        <View {...viewProps}>
            <View style={styles.row} onLayout={handleLayout}>
                <AmountFieldContext.Provider value={contextValue}>{children}</AmountFieldContext.Provider>
            </View>
        </View>
    );
};
