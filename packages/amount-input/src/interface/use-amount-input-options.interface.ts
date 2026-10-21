import type { AmountFormatInterface } from './amount-format.interface';
import type { TextInputProps } from 'react-native';

export interface UseAmountInputOptionsInterface extends Pick<TextInputProps, 'onFocus' | 'onBlur' | 'selectTextOnFocus'> {
    readonly value: number;
    readonly format: AmountFormatInterface;
    readonly onChangeValue: (value: number) => void;
    readonly commitOnBlur?: boolean;
}
