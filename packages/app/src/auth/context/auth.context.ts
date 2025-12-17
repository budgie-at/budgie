import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

interface AuthContextInterface {
    isSomeAvailable: boolean;
    isUnlocked: boolean | null;
    isFaceIdAvailable: boolean;
    isTouchIdAvailable: boolean;
    setIsUnlocked: (unlocked: boolean) => void;
}

export const AuthContext = createContext<AuthContextInterface>({
    isUnlocked: false,
    isSomeAvailable: false,
    setIsUnlocked: emptyFn,
    isFaceIdAvailable: false,
    isTouchIdAvailable: false,
});

export const useAuthContext = () => use(AuthContext);
