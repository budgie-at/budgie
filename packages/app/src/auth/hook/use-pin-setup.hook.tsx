import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { PIN_LENGTH } from '../constant/pin-length.constant';
import { useAuthContext } from '../context/auth.context';
import { PinSetupModeEnum } from '../enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';
import { BiometricAuthenticationFailedError } from '../error/biometric-authentication-failed.error';
import { AuthService } from '../service/auth.service';

import { usePinError } from './use-pin-error.hook';

interface Params {
    readonly mode: PinSetupModeEnum;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration hook with multiple state fields and handlers
export const usePinSetup = ({ mode }: Params) => {
    const { t } = useLingui();
    const { isSomeAvailable } = useAuthContext();
    const { clearError, error: pinError, isLockedOut, reportIncorrectPin } = usePinError();

    const [step, setStep] = useState(mode === PinSetupModeEnum.CREATE ? PinSetupStepEnum.CREATE : PinSetupStepEnum.VERIFY_OLD);
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [tempNewPin, setTempNewPin] = useState('');
    const { isLoading: isSubmitting, run: runSubmit } = useSingleFlight();
    const { isLoading: isSaving, run: runSave } = useSingleFlight();
    const isLoading = isSubmitting || isSaving;

    const deleteDigit = () => {
        setError(null);
        clearError();
        setInput(input.slice(0, -1));
    };

    const reset = () => {
        setStep(
            mode === PinSetupModeEnum.CHANGE || mode === PinSetupModeEnum.DISABLE ? PinSetupStepEnum.VERIFY_OLD : PinSetupStepEnum.CREATE
        );
        setError(null);
        setInput('');
        setTempNewPin('');
    };

    const verifyOldPin = async (pin: string): Promise<boolean> => {
        const isCorrect = await appRuntime.runPromise(
            Effect.flatMap(AuthService, authService => authService.verifyPin(pin)).pipe(
                Effect.tapError(Effect.logError),
                Effect.orElseSucceed(() => false)
            )
        );

        if (!isCorrect) {
            reportIncorrectPin();
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
            await appRuntime.runPromise(Effect.flatMap(AuthService, authService => authService.deletePin()));

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

    const savePinAndContinue = (isBiometricEnabled: boolean) =>
        runSave(() =>
            appRuntime.runPromise(
                Effect.gen(function* () {
                    const authService = yield* AuthService;

                    if (isBiometricEnabled && isSomeAvailable && !(yield* authService.authenticateWithBiometrics())) {
                        return yield* new BiometricAuthenticationFailedError();
                    }

                    yield* mode === PinSetupModeEnum.CHANGE
                        ? authService.changePin(tempNewPin)
                        : authService.createPin(tempNewPin, isBiometricEnabled);
                }).pipe(Effect.catchCause(() => Effect.sync(() => void setError(t`Failed to save PIN. Please try again.`))))
            )
        );

    const handleConfirmStep = async (pin: string) => {
        if (pin !== tempNewPin) {
            setError(t`PINs do not match`);
            reset();

            return;
        }

        if (mode === PinSetupModeEnum.CHANGE) {
            await savePinAndContinue(false);

            return;
        }

        if (isSomeAvailable) {
            setStep(PinSetupStepEnum.BIOMETRIC);
        } else {
            await savePinAndContinue(false);
        }
    };

    const submitPin = (pin: string) =>
        runSubmit(async () => {
            if (step === PinSetupStepEnum.VERIFY_OLD) {
                await handleVerifyOldStep(pin);
            } else if (step === PinSetupStepEnum.CREATE) {
                handleCreateStep(pin);
            } else if (step === PinSetupStepEnum.CONFIRM) {
                await handleConfirmStep(pin);
            }
        });

    const addDigit = (digit: string) => {
        if (isLockedOut || input.length >= PIN_LENGTH) {
            return;
        }

        const nextInput = input + digit;
        setError(null);
        clearError();
        setInput(nextInput);

        if (nextInput.length === PIN_LENGTH && !isLoading && step !== PinSetupStepEnum.BIOMETRIC) {
            void submitPin(nextInput);
        }
    };

    return {
        state: { mode, step, input, error: pinError ?? error, isLoading, isInputDisabled: isLoading || isLockedOut },
        addDigit,
        deleteDigit,
        saveAndContinue:
            mode === PinSetupModeEnum.DISABLE
                ? () => appRuntime.runPromise(Effect.flatMap(AuthService, authService => authService.deletePin()))
                : savePinAndContinue
    };
};
