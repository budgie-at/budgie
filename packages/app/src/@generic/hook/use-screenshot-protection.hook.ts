import { allowScreenCaptureAsync, preventScreenCaptureAsync, usePermissions } from 'expo-screen-capture';
import { useEffect } from 'react';

import { useSetting } from '../../settings/hook/use-setting.hook';

export const useScreenshotProtection = (): boolean => {
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');
    const [status, requestPermission] = usePermissions();

    useEffect(() => {
        // HINT: Without allowing this in dev mode black screen after fast refresh
        void allowScreenCaptureAsync('setting');

        const setupScreenshotProtection = async () => {
            // HINT: Disable screenshot protection in dev mode for E2E testing with Maestro
            if (__DEV__) {
                await allowScreenCaptureAsync('setting');

                return;
            }

            if (!status?.granted) {
                await requestPermission();
            } else if (isScreenshotProtectionEnabled) {
                await preventScreenCaptureAsync('setting');
            } else {
                await allowScreenCaptureAsync('setting');
            }
        };

        void setupScreenshotProtection();
    }, [isScreenshotProtectionEnabled, requestPermission, status]);

    return isScreenshotProtectionEnabled;
};
