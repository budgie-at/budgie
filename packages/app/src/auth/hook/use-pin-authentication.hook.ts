import { useLingui } from '@lingui/react/macro';
import { router, useIsFocused, useNavigation } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { PIN_LENGTH } from '../constant/pin-length.constant';
import { useAuthContext } from '../context/auth.context';
import { authService } from '../service/auth.service';

import { useAuthAttemptTracker } from './use-auth-attempt-tracker.hook';

import type { AppStateStatus } from 'react-native';

const usePinFormState = () => {
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    return { error, input, isLoading, setError, setInput, setIsLoading };
};

const useAuthAttemptFocus = (invalidateAuthAttempts: () => void) => {
    const navigation = useNavigation();
    const isPinScreenFocused = useIsFocused();
    const isPinScreenFocusedRef = useRef(false);
    const isPinScreenMountedRef = useRef(false);
    const handlePinScreenFocus = useEffectEvent(() => {
        if (isPinScreenFocusedRef.current) {
            return;
        }

        isPinScreenFocusedRef.current = true;
        invalidateAuthAttempts();
    });
    const handlePinScreenBlur = useEffectEvent(() => {
        if (!isPinScreenFocusedRef.current) {
            return;
        }

        isPinScreenFocusedRef.current = false;
        invalidateAuthAttempts();
    });
    const canStartAuthAttempt = () => isPinScreenMountedRef.current && isPinScreenFocusedRef.current && AppState.currentState === 'active';

    useEffect(() => {
        isPinScreenMountedRef.current = true;

        if (navigation.isFocused()) {
            handlePinScreenFocus();
        } else {
            handlePinScreenBlur();
        }

        const unsubscribeFocus = navigation.addListener('focus', handlePinScreenFocus);
        const unsubscribeBlur = navigation.addListener('blur', handlePinScreenBlur);

        return () => {
            unsubscribeFocus();
            unsubscribeBlur();
            isPinScreenMountedRef.current = false;
            handlePinScreenBlur();
        };
    }, [navigation]);

    return { canStartAuthAttempt, isPinScreenFocused, isPinScreenFocusedRef, isPinScreenMountedRef };
};

const useAuthAttemptLifecycle = (
    resetAuthLoading: () => void,
    setPinInput: (input: string) => void,
    acceptAuthAttempt: (success: boolean, isPinAttempt: boolean) => void,
    authAttemptTracker: ReturnType<typeof useAuthAttemptTracker>
) => {
    const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
    const {
        clearDeferredAuthAttempt,
        invalidateAuthAttempt,
        isCurrentAuthAttempt,
        readDeferredAuthAttempt,
        settleAuthAttempt,
        storeDeferredAuthAttempt
    } = authAttemptTracker;
    const invalidateAuthAttempts = () => {
        const shouldClearPinInput = invalidateAuthAttempt();

        resetAuthLoading();

        if (shouldClearPinInput) {
            setPinInput('');
        }
    };
    const { canStartAuthAttempt, isPinScreenFocused, isPinScreenFocusedRef, isPinScreenMountedRef } =
        useAuthAttemptFocus(invalidateAuthAttempts);
    const completeAuthAttempt = (authAttemptGeneration: number, success: boolean, isPinAttempt: boolean) => {
        const isCurrentAttempt =
            isCurrentAuthAttempt(authAttemptGeneration) && isPinScreenMountedRef.current && isPinScreenFocusedRef.current;

        if (!isCurrentAttempt) {
            return;
        }

        if (AppState.currentState === 'inactive') {
            storeDeferredAuthAttempt(authAttemptGeneration, success, isPinAttempt);

            return;
        }

        if (AppState.currentState === 'active') {
            settleAuthAttempt();
            clearDeferredAuthAttempt();
            acceptAuthAttempt(success, isPinAttempt);
        }
    };
    const handleAppStateChange = useEffectEvent((nextAppState: AppStateStatus) => {
        const deferredAuthAttempt = readDeferredAuthAttempt();

        setIsAppActive(nextAppState === 'active');

        if (nextAppState === 'background') {
            invalidateAuthAttempts();

            return;
        }

        if (nextAppState === 'active' && isDefined(deferredAuthAttempt)) {
            completeAuthAttempt(deferredAuthAttempt.authAttemptGeneration, deferredAuthAttempt.success, deferredAuthAttempt.isPinAttempt);
        }
    });

    useEffect(() => {
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        return () => void appStateSubscription.remove();
    }, []);

    return { canStartAuthAttempt, completeAuthAttempt, isAppActive, isPinScreenFocused };
};

const useAutomaticBiometricAuthentication = (
    canStart: boolean,
    authAttemptLifecycle: ReturnType<typeof useAuthAttemptLifecycle>,
    setIsLoading: (isLoading: boolean) => void,
    authAttemptTracker: ReturnType<typeof useAuthAttemptTracker>
) => {
    const [hasAttemptedBiometric, setHasAttemptedBiometric] = useState(false);
    const { canStartAuthAttempt, completeAuthAttempt } = authAttemptLifecycle;
    const { beginBiometricAuthAttempt, releaseBiometricAuthAttempt } = authAttemptTracker;
    const handleAutomaticBiometricResult = useEffectEvent((authAttemptGeneration: number, success: boolean) => {
        completeAuthAttempt(authAttemptGeneration, success, false);
    });
    const handleAutomaticBiometricSettlement = useEffectEvent((authAttemptGeneration: number) => {
        releaseBiometricAuthAttempt(authAttemptGeneration);
    });
    const handleAutomaticBiometricStart = useEffectEvent(() => {
        if (!canStart || hasAttemptedBiometric || !canStartAuthAttempt()) {
            return;
        }

        const authAttemptGeneration = beginBiometricAuthAttempt();

        if (!isDefined(authAttemptGeneration)) {
            return;
        }

        setHasAttemptedBiometric(true);
        setIsLoading(true);
        void authService
            .authenticateWithBiometrics()
            .then(success => void handleAutomaticBiometricResult(authAttemptGeneration, success))
            .finally(() => void handleAutomaticBiometricSettlement(authAttemptGeneration));
    });
    useEffect(() => {
        if (!canStart || hasAttemptedBiometric) {
            return emptyFn;
        }

        const automaticBiometricTimeout = setTimeout(handleAutomaticBiometricStart);

        return () => void clearTimeout(automaticBiometricTimeout);
    }, [canStart, hasAttemptedBiometric]);
};

export const usePinAuthentication = () => {
    const { t } = useLingui();
    const { isFaceIdAvailable, setIsUnlocked } = useAuthContext();
    const canUseBiometric = useSetting('isBiometricEnabled') && isFaceIdAvailable;
    const { error, input, isLoading, setError, setInput, setIsLoading } = usePinFormState();
    const authAttemptTracker = useAuthAttemptTracker();

    const resetAuthLoading = () => {
        setIsLoading(false);
    };
    const acceptAuthAttempt = (success: boolean, isPinAttempt: boolean) => {
        if (!success && isPinAttempt) {
            setInput('');
            setError(t`Incorrect PIN`);
            resetAuthLoading();

            return;
        }

        resetAuthLoading();

        if (success) {
            setIsUnlocked(true);
            router.replace('/');
        }
    };
    const authAttemptLifecycle = useAuthAttemptLifecycle(resetAuthLoading, setInput, acceptAuthAttempt, authAttemptTracker);
    const { canStartAuthAttempt, completeAuthAttempt, isAppActive, isPinScreenFocused } = authAttemptLifecycle;

    const handlePinSubmit = async (pin: string) => {
        if (!isAppActive || !isPinScreenFocused) {
            return;
        }

        const authAttemptGeneration = authAttemptTracker.beginAuthAttempt(true);

        setIsLoading(true);
        completeAuthAttempt(authAttemptGeneration, await authService.verifyPin(pin), true);
    };
    const addDigit = (digit: string) => {
        const nextInput = (input + digit).slice(0, PIN_LENGTH);

        setInput(nextInput);
        setError(null);

        if (input.length === PIN_LENGTH - 1) {
            void handlePinSubmit(nextInput);
        }
    };
    const deleteDigit = () => {
        setInput(input.slice(0, -1));
        setError(null);
    };
    const handleBiometricAuth = async () => {
        if (!canUseBiometric || !canStartAuthAttempt()) {
            return;
        }

        const authAttemptGeneration = authAttemptTracker.beginBiometricAuthAttempt();

        if (!isDefined(authAttemptGeneration)) {
            return;
        }

        setIsLoading(true);

        try {
            completeAuthAttempt(authAttemptGeneration, await authService.authenticateWithBiometrics(), false);
        } finally {
            authAttemptTracker.releaseBiometricAuthAttempt(authAttemptGeneration);
        }
    };
    useAutomaticBiometricAuthentication(
        canUseBiometric && isAppActive && isPinScreenFocused,
        authAttemptLifecycle,
        setIsLoading,
        authAttemptTracker
    );

    return {
        addDigit,
        canUseBiometric,
        description: t`Enter your ${PIN_LENGTH}-digit PIN to unlock`,
        deleteDigit,
        error,
        handleBiometricAuth,
        input,
        isLoading,
        title: t`Enter your PIN`
    };
};
