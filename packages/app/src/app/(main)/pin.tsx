import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { PinForm } from '../../auth/components/pin-form/pin-form';
import { PIN_LENGTH } from '../../auth/constant/pin-length.constant';
import { useAuthContext } from '../../auth/context/auth.context';
import { useBiometricAvailability } from '../../auth/hook/use-biometric-availability.hook';
import { authService } from '../../auth/service/auth.service';
import { useSettingsContext } from '../../settings/context/settings.context';

interface AuthFormStateInterface {
    input: string;
    isLoading: boolean;
    error: string | null;
    hasAttemptedBiometric: boolean;
}

export default function PinScreen() {
    const { t } = useLingui();
    const { setIsUnlocked } = useAuthContext();
    const { settings } = useSettingsContext();
    const { isFaceIdAvailable } = useBiometricAvailability();

    const { isBiometricEnabled } = settings;
    const canUseBiometric = isFaceIdAvailable && isBiometricEnabled;

    const [formState, setFormState] = useState<AuthFormStateInterface>({
        input: '',
        error: null,
        isLoading: false,
        hasAttemptedBiometric: false
    });

    const updateForm = (updates: Partial<AuthFormStateInterface>) => {
        setFormState(prev => ({ ...prev, ...updates }));
    };

    const addDigit = (digit: string) => {
        if (formState.input.length < PIN_LENGTH) {
            updateForm({
                input: formState.input + digit,
                error: null
            });
        }
    };

    const deleteDigit = () => {
        updateForm({
            input: formState.input.slice(0, -1),
            error: null
        });
    };

    const handlePinSubmit = async () => {
        if (formState.input.length < PIN_LENGTH) {
            updateForm({ error: t`PIN must be ${PIN_LENGTH} digits` });

            return;
        }

        updateForm({ isLoading: true });

        const isCorrect = await authService.verifyPin(formState.input);

        updateForm({ isLoading: false });

        if (isCorrect) {
            setIsUnlocked(true);
            router.replace('/');
        } else {
            updateForm({
                error: t`Incorrect PIN`,
                input: ''
            });
        }
    };

    const handleBiometricAuth = async () => {
        if (!canUseBiometric) {
            return;
        }

        updateForm({ isLoading: true });

        const success = await authService.authenticateWithBiometrics();

        updateForm({ isLoading: false });

        if (success) {
            setIsUnlocked(true);
            router.replace('/');
        }
    };

    if (canUseBiometric && !formState.hasAttemptedBiometric) {
        updateForm({ hasAttemptedBiometric: true });
        void handleBiometricAuth();
    }

    if (formState.input.length === PIN_LENGTH && !formState.isLoading) {
        void handlePinSubmit();
    }

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

                {formState.isLoading && (
                    <View className="absolute inset-0 bg-primary-reverse/80 justify-center items-center">
                        <ActivityIndicator size="large" color="var(--color-primary)" />
                    </View>
                )}
            </View>
        </View>
    );
}
