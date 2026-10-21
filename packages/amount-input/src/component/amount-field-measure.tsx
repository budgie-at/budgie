import { useEffect, useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useAmountFieldContext } from '../hooks/use-amount-field-context/use-amount-field-context.hook';

import type { AmountFieldTextPropsInterface } from '../interface/amount-field-text-props.interface';
import type { LayoutChangeEvent } from 'react-native';

interface Props extends Pick<AmountFieldTextPropsInterface, 'style' | 'className' | 'allowFontScaling' | 'maxFontSizeMultiplier'> {
    readonly text: string;
    readonly scale: number;
    readonly extraWidth: number;
    readonly minimumFontSize?: number;
}

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

export const AmountFieldMeasure = (props: Props) => {
    const { text, scale, extraWidth, minimumFontSize, style, className, allowFontScaling, maxFontSizeMultiplier } = props;
    const { baseFontSize, dispatchPartWidth } = useAmountFieldContext();
    const partId = useId();
    const measureFontSize = baseFontSize * scale;
    const typographyProps = {
        className,
        allowFontScaling,
        maxFontSizeMultiplier,
        style: [style, styles.text, { fontSize: measureFontSize }]
    };

    const handleLayout = (event: LayoutChangeEvent) => {
        const textWidth = event.nativeEvent.layout.width;
        const minimumWidth = isDefined(minimumFontSize) ? (textWidth * minimumFontSize) / measureFontSize + extraWidth : 0;

        dispatchPartWidth({ partId, partWidth: { width: textWidth + extraWidth, minimumWidth } });
    };

    useEffect(() => () => void dispatchPartWidth({ partId, partWidth: null }), [partId, dispatchPartWidth]);

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
