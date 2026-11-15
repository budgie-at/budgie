import { useLingui } from '@lingui/react/macro';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { useReducer, useState } from 'react';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { PIN_LENGTH } from '../constant/pin-length.constant';
import { useAuthContext } from '../context/auth.context';
import { BiometricKindEnum } from '../enum/biometric-kind.enum';
import { PinSetupActionTypeEnum } from '../enum/pin-setup-action-type.enum';
import { PinSetupModeEnum } from '../enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';
import { PinSetupActionInterface } from '../interface/pin-setup-action.interface';
import { PinSetupStateInterface } from '../interface/pin-setup-state.interface';
import { AuthService } from '../service/auth.service';

import { usePinError } from './use-pin-error.hook';

const ACCEPTED_PIN_BEAT_MS = 260;
const ACCEPTED_PIN_BEAT = Duration.millis(ACCEPTED_PIN_BEAT_MS);

const reducer = (state: PinSetupStateInterface, action: PinSetupActionInterface): PinSetupStateInterface => {
    if (action.type === PinSetupActionTypeEnum.DIGIT_ADDED) {
        return { ...state, error: null, input: state.input + action.digit };
    }
    if (action.type === PinSetupActionTypeEnum.DIGIT_DELETED) {
        return { ...state, error: null, input: state.input.slice(0, -1) };
    }
    if (action.type === PinSetupActionTypeEnum.OLD_PIN_REJECTED) {
        return { ...state, input: '' };
    }
    if (action.type === PinSetupActionTypeEnum.NEW_PIN_REQUESTED) {
        return { ...state, step: PinSetupStepEnum.CREATE, input: '', error: null };
    }
    if (action.type === PinSetupActionTypeEnum.NEW_PIN_ENTERED) {
        return { ...state, step: PinSetupStepEnum.CONFIRM, input: '', tempNewPin: action.pin };
    }
    if (action.type === PinSetupActionTypeEnum.BIOMETRIC_REQUESTED) {
        return { ...state, step: PinSetupStepEnum.BIOMETRIC };
    }

    return { ...state, input: '', error: action.error };
};

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration hook with multiple state fields and handlers
export const usePinSetup = (mode: PinSetupModeEnum) => {
    const { t } = useLingui();
    const { biometricKind, isSomeAvailable } = useAuthContext();
    const { clearError, error: pinError, isLockedOut, reportIncorrectPin } = usePinError();
    const [hapticNotification] = useVibration();

    const [{ step, input, error, tempNewPin }, dispatch] = useReducer(reducer, {
        step: mode === PinSetupModeEnum.CREATE ? PinSetupStepEnum.CREATE : PinSetupStepEnum.VERIFY_OLD,
        input: '',
        error: null,
        tempNewPin: ''
    });
    const { isLoading, run } = useSingleFlight();
    const [isSealing, setIsSealing] = useState(false);
    const markSealing = Effect.sync(() => void setIsSealing(true));
    const [isAccepted, setIsAccepted] = useState(false);
    const showAcceptedBeat = Effect.sync(() => void setIsAccepted(true)).pipe(
        Effect.andThen(Effect.sleep(ACCEPTED_PIN_BEAT)),
        Effect.ensuring(Effect.sync(() => void setIsAccepted(false)))
    );

    const deleteDigit = () => {
        clearError();
        dispatch({ type: PinSetupActionTypeEnum.DIGIT_DELETED });
    };

    const handleVerifyOldStep = (pin: string) =>
        Effect.gen(function* () {
            const authService = yield* AuthService;
            const isCorrect = yield* authService.verifyPin(pin).pipe(
                Effect.tapError(Effect.logError),
                Effect.orElseSucceed(() => false)
            );

            if (!isCorrect) {
                reportIncorrectPin();
                dispatch({ type: PinSetupActionTypeEnum.OLD_PIN_REJECTED });

                return;
            }

            if (mode === PinSetupModeEnum.DISABLE) {
                yield* markSealing.pipe(
                    Effect.andThen(Effect.flatMap(AuthService, authService => authService.deletePin())),
                    Effect.tapCause(() =>
                        Effect.sync(() => {
                            setIsSealing(false);
                            dispatch({ type: PinSetupActionTypeEnum.ERROR_REPORTED, error: t`Couldn't turn off app lock. Try again.` });
                        })
                    )
                );

                return;
            }

            yield* showAcceptedBeat;
            dispatch({ type: PinSetupActionTypeEnum.NEW_PIN_REQUESTED });
        });

    const biometricErrors: Record<BiometricKindEnum, string> = {
        [BiometricKindEnum.FACE_ID]: t`Face ID wasn't completed. Try again or continue without it.`,
        [BiometricKindEnum.TOUCH_ID]: t`Touch ID wasn't completed. Try again or continue without it.`,
        [BiometricKindEnum.FACE_UNLOCK]: t`Face unlock wasn't completed. Try again or continue without it.`,
        [BiometricKindEnum.FINGERPRINT]: t`Fingerprint unlock wasn't completed. Try again or continue without it.`,
        [BiometricKindEnum.BIOMETRICS]: t`Biometric unlock wasn't completed. Try again or continue without it.`
    };

    const saveFailedMessage =
        step === PinSetupStepEnum.BIOMETRIC ? t`Couldn't save your PIN. Try again.` : t`Couldn't save your PIN. Enter it again to retry.`;

    const savePin = (isBiometricEnabled: boolean) =>
        Effect.gen(function* () {
            const authService = yield* AuthService;

            if (isBiometricEnabled && isSomeAvailable && !(yield* authService.authenticateWithBiometrics())) {
                dispatch({
                    type: PinSetupActionTypeEnum.ERROR_REPORTED,
                    error: biometricErrors[biometricKind ?? BiometricKindEnum.BIOMETRICS]
                });

                return;
            }

            yield* markSealing;

            yield* mode === PinSetupModeEnum.CHANGE
                ? authService.changePin(tempNewPin)
                : authService.createPin(tempNewPin, isBiometricEnabled);
        }).pipe(
            Effect.catchCause(() =>
                Effect.sync(() => {
                    setIsSealing(false);
                    dispatch({ type: PinSetupActionTypeEnum.ERROR_REPORTED, error: saveFailedMessage });
                })
            )
        );

    const handleConfirmStep = (pin: string) =>
        Effect.gen(function* () {
            if (pin !== tempNewPin) {
                dispatch({
                    type: PinSetupActionTypeEnum.ERROR_REPORTED,
                    error: t`PINs don't match. Try again.`
                });

                return;
            }

            hapticNotification(NotificationFeedbackType.Success);
            yield* showAcceptedBeat;

            if (mode !== PinSetupModeEnum.CHANGE && isSomeAvailable) {
                dispatch({ type: PinSetupActionTypeEnum.BIOMETRIC_REQUESTED });

                return;
            }

            yield* savePin(false);
        });

    const submitPin = (pin: string) =>
        run(
            Effect.gen(function* () {
                if (step === PinSetupStepEnum.VERIFY_OLD) {
                    yield* handleVerifyOldStep(pin);
                } else if (step === PinSetupStepEnum.CREATE) {
                    dispatch({ type: PinSetupActionTypeEnum.NEW_PIN_ENTERED, pin });
                } else if (step === PinSetupStepEnum.CONFIRM) {
                    yield* handleConfirmStep(pin);
                }
            })
        );

    const addDigit = (digit: string) => {
        if (isLockedOut || input.length >= PIN_LENGTH) {
            return;
        }

        const nextInput = input + digit;
        clearError();
        dispatch({ type: PinSetupActionTypeEnum.DIGIT_ADDED, digit });

        if (nextInput.length === PIN_LENGTH && !isLoading && step !== PinSetupStepEnum.BIOMETRIC) {
            void submitPin(nextInput);
        }
    };

    const restartNewPin = () => {
        clearError();
        dispatch({ type: PinSetupActionTypeEnum.NEW_PIN_REQUESTED });
    };

    return {
        restartNewPin,
        state: { step, input, error: pinError ?? error, isLoading, isSealing, isAccepted, isInputDisabled: isLoading || isLockedOut },
        addDigit,
        deleteDigit,
        saveAndContinue: (isBiometricEnabled: boolean) => run(savePin(isBiometricEnabled))
    };
};
