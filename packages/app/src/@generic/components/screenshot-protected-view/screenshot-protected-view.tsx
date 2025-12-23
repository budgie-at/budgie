import { ReactNode, useEffect, useState } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';

import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly children: ReactNode;
}

export const ScreenshotProtectedView = ({ children }: Props) => {
    const { settings } = useSettingsContext();
    const { isScreenshotProtectionEnabled } = settings;
    const [isProtectionActive, setIsProtectionActive] = useState(false);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (!isScreenshotProtectionEnabled) {
                return;
            }

            if (nextAppState === 'background' || nextAppState === 'inactive') {
                setIsProtectionActive(true);
            } else if (nextAppState === 'active') {
                setIsProtectionActive(false);
            }
        });

        return () => void subscription.remove();
    }, [isScreenshotProtectionEnabled]);

    const shouldHide = isScreenshotProtectionEnabled && isProtectionActive;

    if (shouldHide) {
        return (
            <View className="opacity-0">
                {children}
            </View>
        );
    }

    return <>{children}</>;
};
