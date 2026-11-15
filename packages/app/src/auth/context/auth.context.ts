import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { BiometricKindEnum } from '../enum/biometric-kind.enum';

export interface AuthContextInterface {
    isUnlocked: boolean;
    isPinEnabled: boolean;
    isSomeAvailable: boolean;
    biometricKind: BiometricKindEnum | null;
    setIsUnlocked: (unlocked: boolean) => void;
}

export const AuthContext = createContext<AuthContextInterface>({
    isUnlocked: false,
    isPinEnabled: false,
    isSomeAvailable: false,
    setIsUnlocked: emptyFn,
    biometricKind: null
});

export const useAuthContext = () => use(AuthContext);
