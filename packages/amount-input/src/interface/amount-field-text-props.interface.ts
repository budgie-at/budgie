import type { TextProps, TextStyle } from 'react-native';

export interface AmountFieldTextPropsInterface extends Omit<TextProps, 'children' | 'numberOfLines'> {
    readonly children: string;
    readonly prefix?: string;
    readonly prefixStyle?: TextStyle;
    readonly className?: string;
}
