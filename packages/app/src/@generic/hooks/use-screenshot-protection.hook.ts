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
            if (!status?.granted) {
                await requestPermission();
            } else if (isScreenshotProtectionEnabled) {
                await preventScreenCaptureAsync('setting');
            } else {
                await allowScreenCaptureAsync('setting');
            }
        };

        void setupScreenshotProtection();
    }, [isScreenshotProtectionEnabled, status]);

    return isScreenshotProtectionEnabled;
};
