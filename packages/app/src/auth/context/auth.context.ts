import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

interface AuthContextInterface {
    isUnlocked: boolean;
    setIsUnlocked: (unlocked: boolean) => void;
}

export const AuthContext = createContext<AuthContextInterface>({
    isUnlocked: false,
    setIsUnlocked: emptyFn
});

export const useAuthContext = () => use(AuthContext);
