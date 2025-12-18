import { ReactNode, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useSettingsContext } from '../../settings/context/settings.context';
import { AuthContext, AuthContextInterface } from '../context/auth.context';
import { useBiometricAvailability } from '../hook/use-biometric-availability.hook';

interface Props {
    readonly children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const { settings, isLoading: settingsLoading } = useSettingsContext();
    const { isFaceIdAvailable, isTouchIdAvailable, isSomeAvailable } = useBiometricAvailability();
    const { isPinEnabled } = settings;

    const [isUnlocked, setIsUnlocked] = useState(false);

    const shouldAutoUnlock = !settingsLoading && !isPinEnabled;

    if (shouldAutoUnlock && !isUnlocked) {
        setIsUnlocked(true);
    }

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background' && isPinEnabled) {
                setIsUnlocked(false);
            }
        });

        return () => void subscription.remove();
    }, [isPinEnabled]);

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
