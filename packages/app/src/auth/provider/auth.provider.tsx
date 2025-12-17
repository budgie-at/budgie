import { ReactNode, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useSettingsContext } from '../../settings/context/settings.context';
import { AuthContext } from '../context/auth.context';
import { useBiometricAvailability } from '../hook/use-biometric-availability.hook';

interface Props {
    readonly children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const { settings } = useSettingsContext();
    const { isPinEnabled } = settings;
    const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
    const { isFaceIdAvailable, isTouchIdAvailable, isSomeAvailable } = useBiometricAvailability();

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (!isPinEnabled) {
                setIsUnlocked(true);
            }

            if (nextAppState === 'background' || nextAppState === 'inactive') {
                setIsUnlocked(false);
            }
        });

        return () => void subscription.remove();
    }, [isPinEnabled]);

    if (!isDefined(isUnlocked) && isPinEnabled) {
        setIsUnlocked(false);
    }

    const value = { isUnlocked, setIsUnlocked, isFaceIdAvailable, isTouchIdAvailable, isSomeAvailable };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
