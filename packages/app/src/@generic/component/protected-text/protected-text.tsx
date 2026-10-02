import { Text, TextProps } from 'react-native';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../hook/use-is-amount-protected.hook';

interface Props extends TextProps {
    readonly placeholderText?: string;
}

export const ProtectedText = ({ children, placeholderText = PROTECTED_AMOUNT_PLACEHOLDER, ...rest }: Props) => {
    const isAmountProtected = useIsAmountProtected();

    return <Text {...rest}>{isAmountProtected ? placeholderText : children}</Text>;
};
