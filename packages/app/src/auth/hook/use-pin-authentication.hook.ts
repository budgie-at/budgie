import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useEffect, useEffectEvent, useReducer, useState } from 'react';
import { AppState } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { appStateAtom } from '../../@generic/constant/app-state-atom.constant';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { PIN_LENGTH } from '../constant/pin-length.constant';
import { useAuthContext } from '../context/auth.context';
import { PinAuthenticationActionTypeEnum } from '../enum/pin-authentication-action-type.enum';
import { PinAuthenticationActionInterface } from '../interface/pin-authentication-action.interface';
import { PinAuthenticationStateInterface } from '../interface/pin-authentication-state.interface';

import { useAuthAttempt } from './use-auth-attempt.hook';
import { usePinError } from './use-pin-error.hook';

const reducer = (state: PinAuthenticationStateInterface, action: PinAuthenticationActionInterface): PinAuthenticationStateInterface => {
    if (action.type === PinAuthenticationActionTypeEnum.DIGIT_ENTERED) {
        return { ...state, input: (state.input + action.digit).slice(0, PIN_LENGTH) };
    }
    if (action.type === PinAuthenticationActionTypeEnum.DIGIT_DELETED) {
        return { ...state, input: state.input.slice(0, -1) };
    }
    if (action.type === PinAuthenticationActionTypeEnum.ATTEMPT_STARTED) {
        return { ...state, isLoading: true };
    }

    return { input: action.shouldClearInput ? '' : state.input, isLoading: false };
};

const useIsAppActive = (onBackground: () => void) => {
    const isAppActive = useAtomValue(appStateAtom) === 'active';
    const handleBackground = useEffectEvent(onBackground);

    useEffect(() => {
        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'background') {
                handleBackground();
            }
        });

        return () => {
            appStateSubscription.remove();
            handleBackground();
        };
    }, []);

    return isAppActive;
};

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
    const isBiometricEnabled = useSetting('isBiometricEnabled');
    const canUseBiometric = isBiometricEnabled && isSomeAvailable;
    const [{ input, isLoading }, dispatch] = useReducer(reducer, { input: '', isLoading: false });
    const { invalidate, startBiometricAttempt, startPinAttempt } = useAuthAttempt();
    const { clearError, error, isLockedOut, reportIncorrectPin } = usePinError();

    const invalidateAuthAttempts = () => {
        dispatch({ type: PinAuthenticationActionTypeEnum.ATTEMPT_ENDED, shouldClearInput: invalidate() });
    };
    const isAppActive = useIsAppActive(invalidateAuthAttempts);

    const acceptAttempt = (isPinAttempt: boolean) => (success: boolean) => {
        dispatch({ type: PinAuthenticationActionTypeEnum.ATTEMPT_ENDED, shouldClearInput: !success && isPinAttempt });

        if (success) {
            setIsUnlocked(true);
        } else if (isPinAttempt) {
            reportIncorrectPin();
        }
    };

    useAutomaticBiometric(isBiometricEnabled && isAppActive, () => {
        if (AppState.currentState !== 'active' || !startBiometricAttempt(acceptAttempt(false))) {
            return false;
        }

        dispatch({ type: PinAuthenticationActionTypeEnum.ATTEMPT_STARTED });

        return true;
    });

    const addDigit = (digit: string) => {
        if (isLockedOut) {
            return;
        }

        const nextInput = (input + digit).slice(0, PIN_LENGTH);

        dispatch({ type: PinAuthenticationActionTypeEnum.DIGIT_ENTERED, digit });
        clearError();

        if (input.length === PIN_LENGTH - 1 && isAppActive) {
            dispatch({ type: PinAuthenticationActionTypeEnum.ATTEMPT_STARTED });
            startPinAttempt(nextInput, acceptAttempt(true));
        }
    };
    const deleteDigit = () => {
        dispatch({ type: PinAuthenticationActionTypeEnum.DIGIT_DELETED });
        clearError();
    };
    const handleBiometricAuth = () => {
        if (canUseBiometric && AppState.currentState === 'active' && startBiometricAttempt(acceptAttempt(false))) {
            dispatch({ type: PinAuthenticationActionTypeEnum.ATTEMPT_STARTED });
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
