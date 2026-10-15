import * as Effect from 'effect/Effect';
import * as SecureStore from 'expo-secure-store';
import { ReactNode, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { PIN_SECURE_STORE_OPTIONS } from '../constant/pin-secure-store-options.constant';
import { SEAL_UNLOCK_GRANT_KEY } from '../constant/seal-unlock-grant-key.constant';
import { AuthContext, AuthContextInterface } from '../context/auth.context';
import { useBiometricAvailability } from '../hook/use-biometric-availability.hook';
import { AuthService } from '../service/auth.service';

const SEAL_UNLOCK_GRANT_MAX_AGE_MS = 60_000;

const hasFreshSealUnlockGrant = (): boolean => {
    const grantedAt = SecureStore.getItem(SEAL_UNLOCK_GRANT_KEY, PIN_SECURE_STORE_OPTIONS);

    if (!isNotEmptyString(grantedAt)) {
        return false;
    }

    const grantAge = Date.now() - Number(grantedAt);

    return grantAge >= 0 && grantAge < SEAL_UNLOCK_GRANT_MAX_AGE_MS;
};

interface Props {
    readonly children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const { settings, isLoading: settingsLoading } = useSettingsContext();
    const { isFaceIdAvailable, isTouchIdAvailable, isSomeAvailable } = useBiometricAvailability();
    const { isPinEnabled } = settings;

    const [isUnlocked, setIsUnlocked] = useState(hasFreshSealUnlockGrant);
    const [hasEnteredPinSinceLaunch, setHasEnteredPinSinceLaunch] = useState(isUnlocked);

    const shouldAutoUnlock = !settingsLoading && !isPinEnabled;

    if (shouldAutoUnlock && !isUnlocked) {
        setIsUnlocked(true);
    }

    useEffect(() => {
        appRuntime.runFork(logAndContinue(Effect.flatMap(AuthService, authService => authService.consumeSealUnlockGrant())));
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background' && isPinEnabled) {
                setIsUnlocked(false);
            }
        });

        return () => void subscription.remove();
    }, [isPinEnabled]);

    const markPinEntered = () => void setHasEnteredPinSinceLaunch(true);

    const value: AuthContextInterface = {
        isUnlocked,
        setIsUnlocked,
        hasEnteredPinSinceLaunch,
        markPinEntered,
        isFaceIdAvailable,
        isTouchIdAvailable,
        isSomeAvailable,
        isPinEnabled
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
