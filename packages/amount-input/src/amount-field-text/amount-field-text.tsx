import { StyleSheet, Text } from 'react-native';

import { AmountFieldMeasure } from '../component/amount-field-measure';
import { useAmountFieldContext } from '../hooks/use-amount-field-context/use-amount-field-context.hook';

import type { AmountFieldTextPropsInterface } from '../interface/amount-field-text-props.interface';

const styles = StyleSheet.create({
    text: {
        flexGrow: 1,
        flexShrink: 1
    }
});

export const AmountFieldText = (props: AmountFieldTextPropsInterface) => {
    const { children, style, className, allowFontScaling, maxFontSizeMultiplier, ...textProps } = props;
    const { fontSize, contentOpacity } = useAmountFieldContext();
    const typographyProps = {
        className,
        allowFontScaling,
        maxFontSizeMultiplier,
        style: [styles.text, style, { fontSize, opacity: contentOpacity }]
    };

    return (
        <>
            <Text {...textProps} {...typographyProps} numberOfLines={1}>
                {children}
            </Text>
            <AmountFieldMeasure
                text={children}
                scale={1}
                extraWidth={0}
                style={style}
                className={className}
                allowFontScaling={allowFontScaling}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
            />
        </>
    );
};
