import { Text } from 'react-native';

import { useAmountFieldContext } from '../hooks/use-amount-field-context/use-amount-field-context.hook';

import { AmountFieldMeasure } from './amount-field-measure';

import type { AmountFieldSymbolPropsInterface } from '../interface/amount-field-symbol-props.interface';

const SYMBOL_GAP_SCALE = 0.2;

interface Props extends AmountFieldSymbolPropsInterface {
    readonly gapSide: 'marginStart' | 'marginEnd';
}

export const AmountFieldSymbol = ({ children, scale = 1, gapSide, style, className, ...textProps }: Props) => {
    const { fontSize, baseFontSize } = useAmountFieldContext();
    const measureExtraWidth = baseFontSize * SYMBOL_GAP_SCALE;
    const typographyProps = {
        className,
        style: [style, { fontSize: fontSize * scale, [gapSide]: fontSize * SYMBOL_GAP_SCALE }]
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
