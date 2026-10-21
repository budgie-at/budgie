import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface AuthContextInterface {
    isUnlocked: boolean;
    hasEnteredPinSinceLaunch: boolean;
    isPinEnabled: boolean;
    isSomeAvailable: boolean;
    isFaceIdAvailable: boolean;
    isTouchIdAvailable: boolean;
    setIsUnlocked: (unlocked: boolean) => void;
    markPinEntered: () => void;
}

export const AuthContext = createContext<AuthContextInterface>({
    isUnlocked: false,
    hasEnteredPinSinceLaunch: false,
    isPinEnabled: false,
    isSomeAvailable: false,
    setIsUnlocked: emptyFn,
    markPinEntered: emptyFn,
    isFaceIdAvailable: false,
    isTouchIdAvailable: false
});

export const useAuthContext = () => use(AuthContext);
