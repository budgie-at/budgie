import * as Effect from 'effect/Effect';
import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';
import { useEffect } from 'react';

import { useSetting } from '../../../settings/hook/use-setting.hook';
import { appRuntime } from '../../runtime/app.runtime';
import { logAndContinue } from '../../utils/log-and-continue.util';

export const ScreenshotProtectionController = () => {
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');

    useEffect(() => {
        const syncScreenCaptureProtection = Effect.promise(() =>
            isScreenshotProtectionEnabled ? preventScreenCaptureAsync('setting') : allowScreenCaptureAsync('setting')
        );
        const fiber = appRuntime.runFork(logAndContinue(syncScreenCaptureProtection));

        return () => void fiber.interruptUnsafe();
    }, [isScreenshotProtectionEnabled]);

    return null;
};
