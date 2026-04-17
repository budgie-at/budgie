import { Text, TextProps } from 'react-native';

import { useAppState } from '../../hook/use-app-state.hook';
import { useScreenshotProtection } from '../../hook/use-screenshot-protection.hook';

interface Props extends TextProps {
    readonly placeholderText?: string;
}

export const ProtectedText = ({ children, placeholderText = '***.**', ...rest }: Props) => {
    const { isActive } = useAppState();

    const isScreenshotProtectionEnabled = useScreenshotProtection();
    const shouldProtect = isScreenshotProtectionEnabled && !isActive;

    return <Text {...rest}>{shouldProtect ? placeholderText : children}</Text>;
};
