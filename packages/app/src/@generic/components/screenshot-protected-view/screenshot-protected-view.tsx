import { ReactNode } from 'react';
import { View } from 'react-native';

import { useScreenshotProtection } from '../../hooks/use-screenshot-protection.hook';

interface Props {
    readonly children: ReactNode;
}

export const ScreenshotProtectedView = ({ children }: Props) => {
    const { isProtectionActive } = useScreenshotProtection();

    if (isProtectionActive) {
        return (
            <View className="opacity-0">
                {children}
            </View>
        );
    }

    return <>{children}</>;
};
