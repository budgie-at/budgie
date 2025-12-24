import { PermissionStatus, allowScreenCaptureAsync, preventScreenCaptureAsync, requestPermissionsAsync } from 'expo-screen-capture';
import { useEffect } from 'react';

import { useSetting } from '../../settings/hook/use-setting.hook';

export const useScreenshotProtection = (): boolean => {
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');

    useEffect(() => {
        const setupScreenshotProtection = async () => {
            const { status } = await requestPermissionsAsync();

            if (status === PermissionStatus.GRANTED) {
                if (isScreenshotProtectionEnabled) {
                    await preventScreenCaptureAsync('setting');
                } else {
                    await allowScreenCaptureAsync('setting');
                }
            }
        };

        void setupScreenshotProtection();
    }, [isScreenshotProtectionEnabled]);

    return isScreenshotProtectionEnabled;
};
