import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';
import { useEffect } from 'react';

import { useSetting } from '../../settings/hook/use-setting.hook';

export const useScreenshotProtection = (): boolean => {
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');

    useEffect(() => {
        const setupScreenshotProtection = async () => {
            if (isScreenshotProtectionEnabled) {
                await preventScreenCaptureAsync();
            } else {
                await allowScreenCaptureAsync();
            }
        };

        void setupScreenshotProtection();
    }, [isScreenshotProtectionEnabled]);

    return isScreenshotProtectionEnabled;
};
