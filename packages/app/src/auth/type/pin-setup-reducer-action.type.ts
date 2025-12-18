import { MessageDescriptor } from '@lingui/core';

import { PinSetupReducerActionEnum } from '../enum/pin-setup-reducer-action.enum';

export type PinSetupReducerAction =
    | { type: PinSetupReducerActionEnum.ADD_DIGIT; digit: string }
    | { type: PinSetupReducerActionEnum.DELETE_DIGIT }
    | { type: PinSetupReducerActionEnum.RESET_INPUT }
    | { type: PinSetupReducerActionEnum.SET_ERROR; error: MessageDescriptor }
    | { type: PinSetupReducerActionEnum.SET_LOADING; loading: boolean }
    | { type: PinSetupReducerActionEnum.VERIFY_OLD_SUCCESS }
    | { type: PinSetupReducerActionEnum.STORE_NEW_PIN; pin: string }
    | { type: PinSetupReducerActionEnum.NEXT_STEP }
    | { type: PinSetupReducerActionEnum.RESET }
    | { type: PinSetupReducerActionEnum.CLEAR_JUST_COMPLETED };
