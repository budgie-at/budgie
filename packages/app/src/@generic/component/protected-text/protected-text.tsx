import { Text, TextProps } from 'react-native';

import { useE2ERuntimeContext } from '../../../@e2e/context/e2e-runtime.context';
import { useAppState } from '../../hook/use-app-state.hook';
import { useScreenshotProtection } from '../../hook/use-screenshot-protection.hook';

interface Props extends TextProps {
    readonly placeholderText?: string;
}

export const ProtectedText = ({ children, placeholderText = '***.**', ...rest }: Props) => {
    const { isActive } = useAppState();
    const { forceProtected } = useE2ERuntimeContext();

    const isScreenshotProtectionEnabled = useScreenshotProtection();
    const shouldProtect = isScreenshotProtectionEnabled && (!isActive || forceProtected);

    return <Text {...rest}>{shouldProtect ? placeholderText : children}</Text>;
};
