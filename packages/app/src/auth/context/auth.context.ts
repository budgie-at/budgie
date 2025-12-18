import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface AuthContextInterface {
    isLoading: boolean;
    isUnlocked: boolean;
    isPinEnabled: boolean;
    isSomeAvailable: boolean;
    isFaceIdAvailable: boolean;
    isTouchIdAvailable: boolean;
    setIsUnlocked: (unlocked: boolean) => void;
}

export const AuthContext = createContext<AuthContextInterface>({
    isLoading: false,
    isUnlocked: false,
    isPinEnabled: false,
    isSomeAvailable: false,
    setIsUnlocked: emptyFn,
    isFaceIdAvailable: false,
    isTouchIdAvailable: false
});

export const useAuthContext = () => use(AuthContext);
