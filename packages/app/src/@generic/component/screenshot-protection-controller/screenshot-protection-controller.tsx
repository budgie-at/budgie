import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';
import { useEffect } from 'react';

import { useSetting } from '../../../settings/hook/use-setting.hook';

export const ScreenshotProtectionController = () => {
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');

    useEffect(() => {
        const syncScreenCaptureProtection = async () => {
            if (isScreenshotProtectionEnabled) {
                await preventScreenCaptureAsync('setting');
            } else {
                await allowScreenCaptureAsync('setting');
            }
        };

        void syncScreenCaptureProtection();
    }, [isScreenshotProtectionEnabled]);

    return null;
};
