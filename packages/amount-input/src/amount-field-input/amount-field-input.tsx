import { StyleSheet, TextInput } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { AmountFieldMeasure } from '../component/amount-field-measure';
import { useAmountFieldContext } from '../hooks/use-amount-field-context/use-amount-field-context.hook';
import { useAmountInput } from '../hooks/use-amount-input/use-amount-input.hook';

import type { AmountFieldInputPropsInterface } from '../interface/amount-field-input-props.interface';

const styles = StyleSheet.create({
    input: {
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0,
        paddingHorizontal: 0,
        paddingVertical: 0
    }
});

export const AmountFieldInput = (props: AmountFieldInputPropsInterface) => {
    const {
        value,
        format,
        onChangeValue,
        selectTextOnFocus,
        onFocus,
        onBlur,
        placeholder = '',
        style,
        className,
        allowFontScaling,
        maxFontSizeMultiplier,
        ...textInputProps
    } = props;
    const { fontSize, contentOpacity } = useAmountFieldContext();
    const amountInputProps = useAmountInput({ value, format, onChangeValue, selectTextOnFocus, onFocus, onBlur });
    const typographyProps = {
        className,
        allowFontScaling,
        maxFontSizeMultiplier,
        style: [styles.input, style, { fontSize, opacity: contentOpacity }]
    };
    const measuredText = isNotEmptyString(amountInputProps.value) ? amountInputProps.value : placeholder;

    return (
        <>
            <TextInput {...textInputProps} {...amountInputProps} {...typographyProps} placeholder={placeholder} />
            <AmountFieldMeasure
                text={measuredText}
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
