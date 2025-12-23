import { ReactNode } from 'react';
import { Text, TextProps } from 'react-native';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { useAppState } from '../../hooks/use-app-state.hook';

interface Props extends TextProps {
    readonly children: ReactNode;
    readonly placeholderText?: string;
}

export const ProtectedText = ({ children, placeholderText = '***.**', ...rest }: Props) => {
    const { settings } = useSettingsContext();
    const { isScreenshotProtectionEnabled } = settings;
    const { isBackground, isInactive } = useAppState();

    const shouldProtect = isScreenshotProtectionEnabled && (isBackground || isInactive);

    return <Text {...rest}>{shouldProtect ? placeholderText : children}</Text>;
};
