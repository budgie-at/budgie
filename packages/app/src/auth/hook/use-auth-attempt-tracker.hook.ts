import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

const useDeferredAuthAttempt = () => {
    const authAttemptGenerationRef = useRef<number | null>(null);
    const authAttemptIsPinRef = useRef(false);
    const authAttemptSuccessRef = useRef(false);

    const clear = () => {
        authAttemptGenerationRef.current = null;
        authAttemptIsPinRef.current = false;
        authAttemptSuccessRef.current = false;
    };
    const read = () => {
        if (!isDefined(authAttemptGenerationRef.current)) {
            return null;
        }

        return {
            authAttemptGeneration: authAttemptGenerationRef.current,
            isPinAttempt: authAttemptIsPinRef.current,
            success: authAttemptSuccessRef.current
        };
    };
    const store = (authAttemptGeneration: number, success: boolean, isPinAttempt: boolean) => {
        authAttemptGenerationRef.current = authAttemptGeneration;
        authAttemptIsPinRef.current = isPinAttempt;
        authAttemptSuccessRef.current = success;
    };

    return { clear, read, store };
};

export const useAuthAttemptTracker = () => {
    const authAttemptGenerationRef = useRef(0);
    const authAttemptIsPinRef = useRef(false);
    const biometricAuthAttemptGenerationRef = useRef<number | null>(null);
    const isAuthAttemptInFlightRef = useRef(false);
    const { clear: clearDeferredAuthAttempt, read: readDeferredAuthAttempt, store: storeDeferredAuthAttempt } = useDeferredAuthAttempt();
    const beginAuthAttempt = (isPinAttempt: boolean) => {
        clearDeferredAuthAttempt();
        authAttemptGenerationRef.current += 1;
        authAttemptIsPinRef.current = isPinAttempt;
        isAuthAttemptInFlightRef.current = true;

        return authAttemptGenerationRef.current;
    };
    const beginBiometricAuthAttempt = () => {
        if (isAuthAttemptInFlightRef.current || isDefined(biometricAuthAttemptGenerationRef.current)) {
            return null;
        }

        const authAttemptGeneration = beginAuthAttempt(false);

        biometricAuthAttemptGenerationRef.current = authAttemptGeneration;

        return authAttemptGeneration;
    };
    const invalidateAuthAttempt = () => {
        const shouldClearPinInput = isAuthAttemptInFlightRef.current && authAttemptIsPinRef.current;

        authAttemptGenerationRef.current += 1;
        authAttemptIsPinRef.current = false;
        isAuthAttemptInFlightRef.current = false;
        clearDeferredAuthAttempt();

        return shouldClearPinInput;
    };
    const isCurrentAuthAttempt = (authAttemptGeneration: number) => authAttemptGeneration === authAttemptGenerationRef.current;
    const releaseBiometricAuthAttempt = (authAttemptGeneration: number) => {
        if (biometricAuthAttemptGenerationRef.current === authAttemptGeneration) {
            biometricAuthAttemptGenerationRef.current = null;
        }
    };
    const settleAuthAttempt = () => {
        authAttemptIsPinRef.current = false;
        isAuthAttemptInFlightRef.current = false;
    };

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
