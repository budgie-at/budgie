import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useIsFocused, useNavigation } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { PIN_LENGTH } from '../constant/pin-length.constant';
import { useAuthContext } from '../context/auth.context';

import { useAuthAttempt } from './use-auth-attempt.hook';
import { usePinError } from './use-pin-error.hook';

import type { AppStateStatus } from 'react-native';

const useAuthAttemptFocus = (invalidateAuthAttempts: () => void) => {
    const navigation = useNavigation();
    const isPinScreenFocused = useIsFocused();
    const isPinScreenFocusedRef = useRef(false);
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
    const canStartAuthAttempt = () => isPinScreenFocusedRef.current && AppState.currentState === 'active';

    useEffect(() => {
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
            handlePinScreenBlur();
        };
    }, [navigation]);

    return { canStartAuthAttempt, isPinScreenFocused };
};

const useIsAppActive = (onBackground: () => void) => {
    const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
    const handleAppStateChange = useEffectEvent((nextAppState: AppStateStatus) => {
        setIsAppActive(nextAppState === 'active');

        if (nextAppState === 'background') {
            onBackground();
        }
    });

    useEffect(() => {
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        return () => void appStateSubscription.remove();
    }, []);

    return isAppActive;
};

const useAuthAttemptGate = (invalidateAuthAttempts: () => void) => ({
    ...useAuthAttemptFocus(invalidateAuthAttempts),
    isAppActive: useIsAppActive(invalidateAuthAttempts)
});

const useAutomaticBiometric = (canStart: boolean, attempt: () => boolean) => {
    const [hasAttempted, setHasAttempted] = useState(false);
    const canStartAutomatically = canStart && !hasAttempted;
    const handleStart = useEffectEvent(() => {
        if (attempt()) {
            setHasAttempted(true);
        }
    });

    useEffect(() => {
        if (!canStartAutomatically) {
            return emptyFn;
        }

        const automaticBiometricFiber = appRuntime.runFork(Effect.sleep(0).pipe(Effect.andThen(Effect.sync(handleStart))));

        return () => void automaticBiometricFiber.interruptUnsafe();
    }, [canStartAutomatically]);
};

export const usePinAuthentication = () => {
    const { t } = useLingui();
    const { isFaceIdAvailable, isSomeAvailable, setIsUnlocked } = useAuthContext();
    const canUseBiometric = useSetting('isBiometricEnabled') && isSomeAvailable;
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { invalidate, startBiometricAttempt, startPinAttempt } = useAuthAttempt();
    const { clearError, error, isLockedOut, reportIncorrectPin } = usePinError();

    const invalidateAuthAttempts = () => {
        const shouldClearPinInput = invalidate();

        setIsLoading(false);

        if (shouldClearPinInput) {
            setInput('');
        }
    };
    const { canStartAuthAttempt, isAppActive, isPinScreenFocused } = useAuthAttemptGate(invalidateAuthAttempts);

    const acceptAttempt = (isPinAttempt: boolean) => (success: boolean) => {
        setIsLoading(false);

        if (success) {
            setIsUnlocked(true);
        } else if (isPinAttempt) {
            setInput('');
            reportIncorrectPin();
        }
    };

    useAutomaticBiometric(canUseBiometric && isAppActive && isPinScreenFocused, () => {
        if (!canStartAuthAttempt() || !startBiometricAttempt(acceptAttempt(false))) {
            return false;
        }

        setIsLoading(true);

        return true;
    });

    const addDigit = (digit: string) => {
        if (isLockedOut) {
            return;
        }

        const nextInput = (input + digit).slice(0, PIN_LENGTH);

        setInput(nextInput);
        clearError();

        if (input.length === PIN_LENGTH - 1 && isAppActive && isPinScreenFocused) {
            setIsLoading(true);
            startPinAttempt(nextInput, acceptAttempt(true));
        }
    };
    const deleteDigit = () => {
        setInput(input.slice(0, -1));
        clearError();
    };
    const handleBiometricAuth = () => {
        if (canUseBiometric && canStartAuthAttempt() && startBiometricAttempt(acceptAttempt(false))) {
            setIsLoading(true);
        }
    };

    return {
        addDigit,
        canUseBiometric,
        description: t`Enter your ${PIN_LENGTH}-digit PIN to unlock`,
        deleteDigit,
        error,
        handleBiometricAuth,
        input,
        isFaceIdAvailable,
        isInputDisabled: isLoading || isLockedOut,
        isLoading,
        title: t`Enter your PIN`
    };
};
