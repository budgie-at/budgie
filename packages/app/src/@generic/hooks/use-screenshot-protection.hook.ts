import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useSettingsContext } from '../../settings/context/settings.context';

export const useScreenshotProtection = () => {
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

    return { isProtectionActive: isScreenshotProtectionEnabled && isProtectionActive };
};
