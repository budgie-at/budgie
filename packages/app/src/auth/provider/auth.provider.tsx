import { logAndContinue } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import { ReactNode, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { isSettingsLoadingAtom } from '../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { SiriCatalogService } from '../../siri/service/siri-catalog.service';
import { AuthContext, AuthContextInterface } from '../context/auth.context';
import { useBiometricAvailability } from '../hook/use-biometric-availability.hook';
import { AuthService } from '../service/auth.service';
import { hasFreshSealUnlockGrant } from '../utils/has-fresh-seal-unlock-grant.util';

interface Props {
    readonly children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const settingsLoading = useAtomValue(isSettingsLoadingAtom);
    const { isFaceIdAvailable, isTouchIdAvailable, isSomeAvailable } = useBiometricAvailability();
    const isPinEnabled = useSetting('isPinEnabled');

    const [isUnlocked, setIsUnlocked] = useState(hasFreshSealUnlockGrant);

    const shouldAutoUnlock = !settingsLoading && !isPinEnabled;

    if (shouldAutoUnlock && !isUnlocked) {
        setIsUnlocked(true);
    }

    useEffect(() => {
        appRuntime.runFork(logAndContinue(Effect.flatMap(AuthService, authService => authService.consumeSealUnlockGrant())));
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState !== 'background') {
                return;
            }

            appRuntime.runFork(logAndContinue(Effect.flatMap(SiriCatalogService, siriCatalogService => siriCatalogService.publish())));

            if (isPinEnabled) {
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
        isPinEnabled
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
