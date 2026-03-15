import { requireOptionalNativeModule } from 'expo-modules-core';
import { useEffect } from 'react';

interface DevMenuPreferencesModule {
    setPreferencesAsync: (settings: {
        showFloatingActionButton?: boolean;
        touchGestureEnabled?: boolean;
        showsAtLaunch?: boolean;
    }) => Promise<void>;
}

export const DevMenuController = () => {
    useEffect(() => {
        if (!__DEV__) {
            return;
        }

        // eslint-disable-next-line lingui/no-unlocalized-strings -- Native Expo module name.
        const devMenuPreferences = requireOptionalNativeModule<DevMenuPreferencesModule>('DevMenuPreferences');

        if (!devMenuPreferences) {
            return;
        }

        // Hide Expo's floating dev-menu button so it doesn't block app controls during Maestro runs.
        void devMenuPreferences.setPreferencesAsync({
            showFloatingActionButton: false,
            touchGestureEnabled: false,
            showsAtLaunch: false
        });
    }, []);

    return null;
};
