import { createContext, use } from 'react';

import { E2ERuntimeOverridesInterface } from '../interface/e2e-runtime-overrides.interface';

const defaultValue: E2ERuntimeOverridesInterface = {
    forceProtected: false,
    forceFaceId: false,
    biometricAuthSuccess: null
};

export const E2ERuntimeContext = createContext<E2ERuntimeOverridesInterface>(defaultValue);

export const useE2ERuntimeContext = () => use(E2ERuntimeContext);
