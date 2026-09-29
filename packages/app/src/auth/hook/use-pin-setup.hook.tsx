import { msg } from '@lingui/core/macro';
import { useState } from 'react';

import { PIN_LENGTH } from '../constant/pin-length.constant';
import { useAuthContext } from '../context/auth.context';
import { PinSetupModeEnum } from '../enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';
import { authService } from '../service/auth.service';

import type { MessageDescriptor } from '@lingui/core';

interface Params {
    readonly mode: PinSetupModeEnum;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration hook with multiple state fields and handlers
export const usePinSetup = ({ mode }: Params) => {
    const { isLoading: biometricLoading, isSomeAvailable } = useAuthContext();

    const [step, setStep] = useState(mode === PinSetupModeEnum.CREATE ? PinSetupStepEnum.CREATE : PinSetupStepEnum.VERIFY_OLD);
    const [input, setInput] = useState('');
    const [error, setError] = useState<MessageDescriptor | null>(null);
    const [tempNewPin, setTempNewPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const deleteDigit = () => {
        setError(null);
        setInput(input.slice(0, -1));
    };

    const reset = () => {
        setStep(
            mode === PinSetupModeEnum.CHANGE || mode === PinSetupModeEnum.DISABLE ? PinSetupStepEnum.VERIFY_OLD : PinSetupStepEnum.CREATE
        );
        setError(null);
        setInput('');
        setTempNewPin('');
        setIsLoading(false);
    };

    const verifyOldPin = async (pin: string): Promise<boolean> => {
        const isCorrect = await authService.verifyPin(pin);

        if (!isCorrect) {
            setError(msg`Incorrect PIN`);
            setInput('');

            return false;
        }

        return true;
    };

    const handleVerifyOldStep = async (pin: string) => {
        const success = await verifyOldPin(pin);

        if (!success) {
            return;
        }

        if (mode === PinSetupModeEnum.DISABLE) {
            await authService.deletePin();

            return;
        }

        setStep(PinSetupStepEnum.CREATE);
        setInput('');
    };

    const handleCreateStep = (pin: string) => {
        setTempNewPin(pin);
        setStep(PinSetupStepEnum.CONFIRM);
        setInput('');
    };

    const savePinAndContinue = async (isBiometricEnabled: boolean) => {
        setIsLoading(true);

        try {
            if (isBiometricEnabled && isSomeAvailable) {
                const success = await authService.authenticateWithBiometrics();

                if (!success) {
                    throw new Error();
                }
            }

            if (mode === PinSetupModeEnum.CHANGE) {
                await authService.changePin(tempNewPin);
            } else {
                await authService.createPin(tempNewPin, isBiometricEnabled);
            }
        } catch {
            setError(msg`Failed to save PIN. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmStep = async (pin: string) => {
        if (pin !== tempNewPin) {
            setError(msg`PINs do not match`);
            reset();

            return;
        }

        if (mode === PinSetupModeEnum.CHANGE) {
            await savePinAndContinue(false);

            return;
        }

        if (isSomeAvailable && !biometricLoading) {
            setStep(PinSetupStepEnum.BIOMETRIC);
        } else {
            await savePinAndContinue(false);
        }
    };

    const submitPin = async (pin: string) => {
        setIsLoading(true);

        try {
            if (step === PinSetupStepEnum.VERIFY_OLD) {
                await handleVerifyOldStep(pin);
            } else if (step === PinSetupStepEnum.CREATE) {
                handleCreateStep(pin);
            } else if (step === PinSetupStepEnum.CONFIRM) {
                await handleConfirmStep(pin);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const addDigit = (digit: string) => {
        if (input.length >= PIN_LENGTH) {
            return;
        }

        const nextInput = input + digit;
        setError(null);
        setInput(nextInput);

        if (nextInput.length === PIN_LENGTH && !isLoading && step !== PinSetupStepEnum.BIOMETRIC) {
            void submitPin(nextInput);
        }
    };

    return {
        state: { mode, step, input, error, isLoading },
        addDigit,
        deleteDigit,
        saveAndContinue: mode === PinSetupModeEnum.DISABLE ? () => authService.deletePin() : savePinAndContinue
    };
};
