import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { LoadingOverlay } from '../../@generic/component/loading-overlay/loading-overlay';
import { PinForm } from '../../auth/components/pin-form/pin-form';
import { PIN_LENGTH } from '../../auth/constant/pin-length.constant';
import { useAuthContext } from '../../auth/context/auth.context';
import { authService } from '../../auth/service/auth.service';
import { useSetting } from '../../settings/hook/use-setting.hook';

interface AuthFormStateInterface {
    input: string;
    isLoading: boolean;
    error: string | null;
    hasAttemptedBiometric: boolean;
    isAutomaticBiometricPending: boolean;
}

const INITIAL_AUTH_FORM_STATE: AuthFormStateInterface = {
    input: '',
    error: null,
    isLoading: false,
    hasAttemptedBiometric: false,
    isAutomaticBiometricPending: false
};

// eslint-disable-next-line max-statements -- PIN screen orchestrates unlock and biometric retry
export default function PinScreen() {
    const { t } = useLingui();

    const { isFaceIdAvailable, setIsUnlocked } = useAuthContext();
    const canUseBiometric = useSetting('isBiometricEnabled') && isFaceIdAvailable;

    const [formState, setFormState] = useState(INITIAL_AUTH_FORM_STATE);
    const isPinScreenActiveRef = useRef(false);

    const updateForm = (updates: Partial<AuthFormStateInterface>) => void setFormState(previousState => ({ ...previousState, ...updates }));

    const handlePinSubmit = async (pin: string) => {
        updateForm({ isLoading: true });

        const isCorrect = await authService.verifyPin(pin);

        if (isCorrect) {
            setIsUnlocked(true);
            router.replace('/');
        } else {
            updateForm({ error: t`Incorrect PIN`, input: '', isLoading: false });
        }
    };

    const addDigit = (digit: string) => {
        const nextInput = (formState.input + digit).slice(0, PIN_LENGTH);

        updateForm({ input: nextInput, error: null });

        if (formState.input.length === PIN_LENGTH - 1) {
            void handlePinSubmit(nextInput);
        }
    };

    const deleteDigit = () => void updateForm({ input: formState.input.slice(0, -1), error: null });

    const completeBiometricAuth = (success: boolean) => {
        if (!isPinScreenActiveRef.current) {
            return;
        }

        updateForm({ isAutomaticBiometricPending: false, isLoading: false });

        if (success) {
            setIsUnlocked(true);
            router.replace('/');
        }
    };

    const handleBiometricAuth = async () => {
        if (!canUseBiometric) {
            return;
        }

        updateForm({ isLoading: true });
        completeBiometricAuth(await authService.authenticateWithBiometrics());
    };

    const handleAutomaticBiometricResult = useEffectEvent(completeBiometricAuth);
    const handleAutomaticBiometricStart = useEffectEvent(() => {
        updateForm({ hasAttemptedBiometric: true, isAutomaticBiometricPending: true, isLoading: true });
    });

    useEffect(() => {
        isPinScreenActiveRef.current = true;

        return () => void (isPinScreenActiveRef.current = false);
    }, []);

    useEffect(() => {
        if (!canUseBiometric || formState.hasAttemptedBiometric) {
            return emptyFn;
        }

        const automaticBiometricTimeout = setTimeout(handleAutomaticBiometricStart);

        return () => void clearTimeout(automaticBiometricTimeout);
    }, [canUseBiometric, formState.hasAttemptedBiometric]);

    useEffect(() => {
        let isActive = true;

        if (formState.isAutomaticBiometricPending) {
            void authService
                .authenticateWithBiometrics()
                .then(success => void (isActive ? handleAutomaticBiometricResult(success) : emptyFn()));
        }

        return () => void (isActive = false);
    }, [formState.isAutomaticBiometricPending]);

    return (
        <View className="flex-1 bg-primary-reverse">
            <View className="flex-1 px-6xl justify-center">
                <PinForm
                    title={t`Enter your PIN`}
                    description={t`Enter your ${PIN_LENGTH}-digit PIN to unlock`}
                    currentInput={formState.input}
                    error={formState.error}
                    isLoading={formState.isLoading}
                    onDigitPress={addDigit}
                    onDeletePress={deleteDigit}
                    onScanPress={handleBiometricAuth}
                    canScan={canUseBiometric}
                />

                {formState.isLoading ? <LoadingOverlay /> : null}
            </View>
        </View>
    );
}
