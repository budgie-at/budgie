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

export const AmountFieldText = ({ children, style, className, ...textProps }: AmountFieldTextPropsInterface) => {
    const { fontSize } = useAmountFieldContext();
    const typographyProps = { className, style: [styles.text, style, { fontSize }] };

    return (
        <>
            <Text {...textProps} {...typographyProps} numberOfLines={1}>
                {children}
            </Text>
            <AmountFieldMeasure text={children} scale={1} extraWidth={0} style={style} className={className} />
        </>
    );
};
