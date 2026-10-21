import { useReducer, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { AmountFieldContext } from '../context/amount-field.context';
import { getFittedFontSize } from '../utils/get-fitted-font-size/get-fitted-font-size.util';
import { reducePartWidths } from '../utils/reduce-part-widths/reduce-part-widths.util';

import type { AmountFieldPropsInterface } from '../interface/amount-field-props.interface';
import type { LayoutChangeEvent } from 'react-native';

const DEFAULT_MINIMUM_FONT_SCALE = 0.3;
const FIT_SLACK_WIDTH = 1;

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
    const [partWidths, dispatchPartWidth] = useReducer(reducePartWidths, {});
    const measuredParts = Object.values(partWidths);
    const fontSize = getFittedFontSize(baseFontSize, minimumFontScale, availableWidth - FIT_SLACK_WIDTH, measuredParts);
    const contentOpacity = isPositiveNumber(availableWidth) && isNotEmptyArray(measuredParts) ? 1 : 0;

    const handleLayout = (event: LayoutChangeEvent) => void setAvailableWidth(event.nativeEvent.layout.width);

    const contextValue = { fontSize, baseFontSize, contentOpacity, dispatchPartWidth };

    return (
        <View {...viewProps}>
            <View style={styles.row} onLayout={handleLayout}>
                <AmountFieldContext.Provider value={contextValue}>{children}</AmountFieldContext.Provider>
            </View>
        </View>
    );
};
