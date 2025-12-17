import { ReactNode, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useSettingsContext } from '../../settings/context/settings.context';
import { AuthContext, AuthContextInterface } from '../context/auth.context';
import { useBiometricAvailability } from '../hook/use-biometric-availability.hook';

interface Props {
    readonly children: ReactNode;
}

const BACKGROUND_LOCK_DELAY_MS = 60 * 1000;

export const AuthProvider = ({ children }: Props) => {
    const { settings, isLoading: settingsLoading } = useSettingsContext();
    const { isFaceIdAvailable, isTouchIdAvailable, isSomeAvailable } = useBiometricAvailability();
    const { isPinEnabled } = settings;

    const [isUnlocked, setIsUnlocked] = useState(false);
    const backgroundTimerRef = useRef<NodeJS.Timeout | null>(null);

    const shouldAutoUnlock = !settingsLoading && !isPinEnabled;

    if (shouldAutoUnlock && !isUnlocked) {
        setIsUnlocked(true);
    }

    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (backgroundTimerRef.current) {
                clearTimeout(backgroundTimerRef.current);
                backgroundTimerRef.current = null;
            }

            if (nextAppState === 'active') {
            } else if ((nextAppState === 'background' || nextAppState === 'inactive') && isPinEnabled && isUnlocked) {
                backgroundTimerRef.current = setTimeout(() => {
                    setIsUnlocked(false);
                }, BACKGROUND_LOCK_DELAY_MS);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
            if (backgroundTimerRef.current) {
                clearTimeout(backgroundTimerRef.current);
            }
        };
    }, [isPinEnabled, isUnlocked]);

    const value: AuthContextInterface = {
        isUnlocked,
        setIsUnlocked,
        isFaceIdAvailable,
        isTouchIdAvailable,
        isSomeAvailable,
        isPinEnabled,
        isLoading: settingsLoading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
