import type { TextInputProps } from 'react-native';

export interface AmountInputPropsInterface extends Required<
    Pick<TextInputProps, 'onChangeText' | 'onFocus' | 'onBlur' | 'keyboardType' | 'submitBehavior' | 'selectTextOnFocus'>
> {
    readonly value: string;
    readonly selection?: TextInputProps['selection'];
}
