import { useReducer } from 'react';

import { PIN_LENGTH } from '../constant/pin-length.constant';
import { PinSetupModeEnum } from '../enum/pin-setup-mode.enum';
import { PinSetupReducerActionEnum } from '../enum/pin-setup-reducer-action.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';
import { PinSetupStateInterface } from '../interface/pin-setup-state.interface';
import { PinSetupReducerAction } from '../type/pin-setup-reducer-action.type';

const pinSetupReducer = (state: PinSetupStateInterface, action: PinSetupReducerAction): PinSetupStateInterface => {
    switch (action.type) {
        case PinSetupReducerActionEnum.ADD_DIGIT:
            if (state.input.length >= PIN_LENGTH) {
                return state;
            }

            return {
                ...state,
                error: null,
                input: state.input + action.digit,
                justCompleted: state.input.length + 1 === PIN_LENGTH
            };
        case PinSetupReducerActionEnum.DELETE_DIGIT:
            return {
                ...state,
                error: null,
                justCompleted: false,
                input: state.input.slice(0, -1)
            };
        case PinSetupReducerActionEnum.RESET_INPUT:
            return { ...state, input: '', justCompleted: false };
        case PinSetupReducerActionEnum.SET_ERROR:
            return { ...state, error: action.error, justCompleted: false };
        case PinSetupReducerActionEnum.SET_LOADING:
            return { ...state, isLoading: action.loading };
        case PinSetupReducerActionEnum.VERIFY_OLD_SUCCESS:
            return { ...state, step: PinSetupStepEnum.CREATE, input: '', justCompleted: false };
        case PinSetupReducerActionEnum.STORE_NEW_PIN:
            return {
                ...state,
                tempNewPin: action.pin,
                step: PinSetupStepEnum.CONFIRM,
                input: '',
                justCompleted: false
            };
        case PinSetupReducerActionEnum.NEXT_STEP:
            return state.step === PinSetupStepEnum.CONFIRM ? { ...state, step: PinSetupStepEnum.BIOMETRIC } : state;
        case PinSetupReducerActionEnum.RESET:
            return {
                ...state,
                step:
                    state.mode === PinSetupModeEnum.CHANGE || state.mode === PinSetupModeEnum.DISABLE
                        ? PinSetupStepEnum.VERIFY_OLD
                        : PinSetupStepEnum.CREATE,
                error: null,
                input: '',
                tempNewPin: '',
                isLoading: false,
                justCompleted: false
            };
        case PinSetupReducerActionEnum.CLEAR_JUST_COMPLETED:
            return { ...state, justCompleted: false };
        default:
            return state;
    }
};

export const usePinSetupReducer = (initialState: PinSetupStateInterface) => useReducer(pinSetupReducer, initialState);
