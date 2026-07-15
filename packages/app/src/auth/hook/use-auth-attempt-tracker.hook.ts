import { useCallback, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

const useDeferredAuthAttempt = () => {
    const authAttemptGenerationRef = useRef<number | null>(null);
    const authAttemptIsPinRef = useRef(false);
    const authAttemptSuccessRef = useRef(false);

    const clear = useCallback(() => {
        authAttemptGenerationRef.current = null;
        authAttemptIsPinRef.current = false;
        authAttemptSuccessRef.current = false;
    }, []);
    const read = useCallback(() => {
        if (!isDefined(authAttemptGenerationRef.current)) {
            return null;
        }

        return {
            authAttemptGeneration: authAttemptGenerationRef.current,
            isPinAttempt: authAttemptIsPinRef.current,
            success: authAttemptSuccessRef.current
        };
    }, []);
    const store = useCallback((authAttemptGeneration: number, success: boolean, isPinAttempt: boolean) => {
        authAttemptGenerationRef.current = authAttemptGeneration;
        authAttemptIsPinRef.current = isPinAttempt;
        authAttemptSuccessRef.current = success;
    }, []);

    return { clear, read, store };
};

export const useAuthAttemptTracker = () => {
    const authAttemptGenerationRef = useRef(0);
    const authAttemptIsPinRef = useRef(false);
    const biometricAuthAttemptGenerationRef = useRef<number | null>(null);
    const isAuthAttemptInFlightRef = useRef(false);
    const { clear: clearDeferredAuthAttempt, read: readDeferredAuthAttempt, store: storeDeferredAuthAttempt } = useDeferredAuthAttempt();
    const beginAuthAttempt = useCallback(
        (isPinAttempt: boolean) => {
            clearDeferredAuthAttempt();
            authAttemptGenerationRef.current += 1;
            authAttemptIsPinRef.current = isPinAttempt;
            isAuthAttemptInFlightRef.current = true;

            return authAttemptGenerationRef.current;
        },
        [clearDeferredAuthAttempt]
    );
    const beginBiometricAuthAttempt = useCallback(() => {
        if (isAuthAttemptInFlightRef.current || isDefined(biometricAuthAttemptGenerationRef.current)) {
            return null;
        }

        const authAttemptGeneration = beginAuthAttempt(false);

        biometricAuthAttemptGenerationRef.current = authAttemptGeneration;

        return authAttemptGeneration;
    }, [beginAuthAttempt]);
    const invalidateAuthAttempt = useCallback(() => {
        const shouldClearPinInput = isAuthAttemptInFlightRef.current && authAttemptIsPinRef.current;

        authAttemptGenerationRef.current += 1;
        authAttemptIsPinRef.current = false;
        isAuthAttemptInFlightRef.current = false;
        clearDeferredAuthAttempt();

        return shouldClearPinInput;
    }, [clearDeferredAuthAttempt]);
    const isCurrentAuthAttempt = useCallback(
        (authAttemptGeneration: number) => authAttemptGeneration === authAttemptGenerationRef.current,
        []
    );
    const releaseBiometricAuthAttempt = useCallback((authAttemptGeneration: number) => {
        if (biometricAuthAttemptGenerationRef.current === authAttemptGeneration) {
            biometricAuthAttemptGenerationRef.current = null;
        }
    }, []);
    const settleAuthAttempt = useCallback(() => {
        authAttemptIsPinRef.current = false;
        isAuthAttemptInFlightRef.current = false;
    }, []);

    return {
        beginAuthAttempt,
        beginBiometricAuthAttempt,
        clearDeferredAuthAttempt,
        invalidateAuthAttempt,
        isCurrentAuthAttempt,
        readDeferredAuthAttempt,
        releaseBiometricAuthAttempt,
        settleAuthAttempt,
        storeDeferredAuthAttempt
    };
};
