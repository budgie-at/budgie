import type { TextProps } from 'react-native';

export interface AmountFieldTextPropsInterface extends Omit<TextProps, 'children' | 'numberOfLines'> {
    readonly children: string;
    readonly className?: string;
}
