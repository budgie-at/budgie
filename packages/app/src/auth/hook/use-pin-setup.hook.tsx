import { msg } from '@lingui/core/macro';

import { PIN_LENGTH } from '../constant/pin-length.constant';
import { useAuthContext } from '../context/auth.context';
import { PinSetupModeEnum } from '../enum/pin-setup-mode.enum';
import { PinSetupReducerActionEnum } from '../enum/pin-setup-reducer-action.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';
import { usePinSetupReducer } from '../reducer/pin-setup.reducer';
import { authService } from '../service/auth.service';

interface Params {
    readonly mode: PinSetupModeEnum;
}

// eslint-disable-next-line max-lines-per-function
export const usePinSetup = ({ mode }: Params) => {
    const { isLoading: biometricLoading, isSomeAvailable } = useAuthContext();

    const [state, dispatch] = usePinSetupReducer({
        mode,
        step: mode === PinSetupModeEnum.CREATE ? PinSetupStepEnum.CREATE : PinSetupStepEnum.VERIFY_OLD,
        input: '',
        error: null,
        tempNewPin: '',
        isLoading: false,
        justCompleted: false
    });

    const addDigit = (digit: string) => void dispatch({ type: PinSetupReducerActionEnum.ADD_DIGIT, digit });

    const deleteDigit = () => void dispatch({ type: PinSetupReducerActionEnum.DELETE_DIGIT });

    const verifyOldPin = async (): Promise<boolean> => {
        const isCorrect = await authService.verifyPin(state.input);

        if (!isCorrect) {
            dispatch({ type: PinSetupReducerActionEnum.SET_ERROR, error: msg`Incorrect PIN` });
            dispatch({ type: PinSetupReducerActionEnum.RESET_INPUT });

            return false;
        }

        return true;
    };

    const handleVerifyOldStep = async () => {
        const success = await verifyOldPin();

        if (!success) {
            return;
        }

        if (mode === PinSetupModeEnum.DISABLE) {
            await authService.deletePin();

            return;
        }

        dispatch({ type: PinSetupReducerActionEnum.VERIFY_OLD_SUCCESS });
    };

    const handleCreateStep = () => void dispatch({ type: PinSetupReducerActionEnum.STORE_NEW_PIN, pin: state.input });

    const savePinAndContinue = async (isBiometricEnabled: boolean) => {
        dispatch({ type: PinSetupReducerActionEnum.SET_LOADING, loading: true });

        try {
            if (isBiometricEnabled && isSomeAvailable) {
                const success = await authService.authenticateWithBiometrics();

                if (!success) {
                    throw new Error();
                }
            }

            if (mode === PinSetupModeEnum.CHANGE) {
                await authService.changePin(state.tempNewPin);
            } else {
                await authService.createPin(state.tempNewPin, isBiometricEnabled);
            }
        } catch {
            dispatch({ type: PinSetupReducerActionEnum.SET_ERROR, error: msg`Failed to save PIN. Please try again.` });
        } finally {
            dispatch({ type: PinSetupReducerActionEnum.SET_LOADING, loading: false });
        }
    };

    const handleConfirmStep = async () => {
        if (state.input !== state.tempNewPin) {
            dispatch({ type: PinSetupReducerActionEnum.SET_ERROR, error: msg`PINs do not match` });
            dispatch({ type: PinSetupReducerActionEnum.RESET });

            return;
        }

        if (mode === PinSetupModeEnum.CHANGE) {
            await savePinAndContinue(false);

            return;
        }

        if (isSomeAvailable && !biometricLoading) {
            dispatch({ type: PinSetupReducerActionEnum.NEXT_STEP });
        } else {
            await savePinAndContinue(false);
        }
    };

    const handleSubmit = async () => {
        if (state.input.length < PIN_LENGTH) {
            dispatch({ type: PinSetupReducerActionEnum.SET_ERROR, error: msg`PIN must be ${PIN_LENGTH} digits` });

            return;
        }

        dispatch({ type: PinSetupReducerActionEnum.SET_LOADING, loading: true });

        try {
            if (state.step === PinSetupStepEnum.VERIFY_OLD) {
                await handleVerifyOldStep();
            } else if (state.step === PinSetupStepEnum.CREATE) {
                handleCreateStep();
            } else if (state.step === PinSetupStepEnum.CONFIRM) {
                await handleConfirmStep();
            }
        } finally {
            dispatch({ type: PinSetupReducerActionEnum.SET_LOADING, loading: false });
        }
    };

    if (state.justCompleted && !state.isLoading && state.step !== PinSetupStepEnum.BIOMETRIC) {
        dispatch({ type: PinSetupReducerActionEnum.CLEAR_JUST_COMPLETED });
        void handleSubmit();
    }

    return {
        state,
        addDigit,
        deleteDigit,
        handleSubmit,
        saveAndContinue: mode === PinSetupModeEnum.DISABLE ? () => authService.deletePin() : savePinAndContinue
    };
};
