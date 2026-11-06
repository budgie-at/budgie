import { Text } from 'react-native';

import { useAmountFieldContext } from '../hooks/use-amount-field-context/use-amount-field-context.hook';

import { AmountFieldMeasure } from './amount-field-measure';

import type { AmountFieldSymbolPropsInterface } from '../interface/amount-field-symbol-props.interface';

const SYMBOL_GAP_SCALE = 0.08;

interface Props extends AmountFieldSymbolPropsInterface {
    readonly gapSide: 'marginStart' | 'marginEnd';
}

export const AmountFieldSymbol = (props: Props) => {
    const {
        children,
        scale = 1,
        minimumFontSize = 0,
        gapSide,
        style,
        className,
        allowFontScaling,
        maxFontSizeMultiplier,
        ...textProps
    } = props;
    const { fontSize, baseFontSize, contentOpacity } = useAmountFieldContext();
    const measureExtraWidth = baseFontSize * SYMBOL_GAP_SCALE;
    const symbolFontSize = Math.max(fontSize * scale, minimumFontSize);
    const typographyProps = {
        className,
        allowFontScaling,
        maxFontSizeMultiplier,
        style: [style, { fontSize: symbolFontSize, opacity: contentOpacity, [gapSide]: fontSize * SYMBOL_GAP_SCALE }]
    };

    return (
        <>
            <Text {...textProps} {...typographyProps} numberOfLines={1}>
                {children}
            </Text>
            <AmountFieldMeasure
                text={children}
                scale={scale}
                extraWidth={measureExtraWidth}
                minimumFontSize={minimumFontSize}
                style={style}
                className={className}
                allowFontScaling={allowFontScaling}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
            />
        </>
    );
};
