import { Text, TextProps } from 'react-native';

import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useAppState } from '../../hooks/use-app-state.hook';

interface Props extends TextProps {
    readonly placeholderText?: string;
}

export const ProtectedText = ({ children, placeholderText = '***.**', ...rest }: Props) => {
    const { isActive } = useAppState();
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');

    const shouldProtect = isScreenshotProtectionEnabled && !isActive;

    return <Text {...rest}>{shouldProtect ? placeholderText : children}</Text>;
};
