import { useEffect, useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAmountFieldContext } from '../hooks/use-amount-field-context/use-amount-field-context.hook';

import type { AmountFieldMeasurePropsInterface } from '../interface/amount-field-measure-props.interface';
import type { LayoutChangeEvent } from 'react-native';

const MEASURE_LAYER_WIDTH = 10_000;

const styles = StyleSheet.create({
    layer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: MEASURE_LAYER_WIDTH,
        flexDirection: 'row',
        alignItems: 'flex-start',
        opacity: 0
    },
    text: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        width: 'auto',
        margin: 0
    }
});

export const AmountFieldMeasure = ({ text, scale, extraWidth, style, className }: AmountFieldMeasurePropsInterface) => {
    const { baseFontSize, setPartWidth } = useAmountFieldContext();
    const partId = useId();
    const typographyProps = { className, style: [style, styles.text, { fontSize: baseFontSize * scale }] };

    const handleLayout = (event: LayoutChangeEvent) => void setPartWidth(partId, event.nativeEvent.layout.width + extraWidth);

    useEffect(() => () => void setPartWidth(partId, null), [partId, setPartWidth]);

    return (
        <View
            pointerEvents="none"
            style={styles.layer}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden
        >
            <Text {...typographyProps} numberOfLines={1} onLayout={handleLayout}>
                {text}
            </Text>
        </View>
    );
};
