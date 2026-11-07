import type { AmountFormatInterface } from './amount-format.interface';
import type { TextInputProps } from 'react-native';

export interface AmountFieldInputPropsInterface extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> {
    readonly value: number;
    readonly format: AmountFormatInterface;
    readonly onChangeValue: (value: number) => void;
    readonly className?: string;
}
