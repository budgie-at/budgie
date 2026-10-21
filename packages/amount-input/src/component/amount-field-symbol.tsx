import { Text } from 'react-native';

import { AMOUNT_FIELD_SYMBOL_GAP_SCALE } from '../constant/amount-field-symbol-gap-scale.constant';
import { useAmountFieldContext } from '../hooks/use-amount-field-context/use-amount-field-context.hook';

import { AmountFieldMeasure } from './amount-field-measure';

import type { AmountFieldSymbolPropsInterface } from '../interface/amount-field-symbol-props.interface';

interface Props extends AmountFieldSymbolPropsInterface {
    readonly gapSide: 'marginStart' | 'marginEnd';
}

export const AmountFieldSymbol = ({ children, scale = 1, gapSide, style, className, ...textProps }: Props) => {
    const { fontSize, baseFontSize } = useAmountFieldContext();
    const measureExtraWidth = baseFontSize * AMOUNT_FIELD_SYMBOL_GAP_SCALE;
    const typographyProps = {
        className,
        style: [style, { fontSize: fontSize * scale, [gapSide]: fontSize * AMOUNT_FIELD_SYMBOL_GAP_SCALE }]
    };

    return (
        <>
            <Text {...textProps} {...typographyProps} numberOfLines={1}>
                {children}
            </Text>
            <AmountFieldMeasure text={children} scale={scale} extraWidth={measureExtraWidth} style={style} className={className} />
        </>
    );
};
