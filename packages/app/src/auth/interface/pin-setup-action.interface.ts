import { PinSetupActionTypeEnum } from '../enum/pin-setup-action-type.enum';

export type PinSetupActionInterface =
    | { readonly type: PinSetupActionTypeEnum.DIGIT_ADDED; readonly digit: string }
    | { readonly type: PinSetupActionTypeEnum.DIGIT_DELETED }
    | { readonly type: PinSetupActionTypeEnum.OLD_PIN_REJECTED }
    | { readonly type: PinSetupActionTypeEnum.NEW_PIN_REQUESTED }
    | { readonly type: PinSetupActionTypeEnum.NEW_PIN_ENTERED; readonly pin: string }
    | { readonly type: PinSetupActionTypeEnum.BIOMETRIC_REQUESTED }
    | { readonly type: PinSetupActionTypeEnum.PINS_MISMATCHED; readonly error: string }
    | { readonly type: PinSetupActionTypeEnum.SAVE_FAILED; readonly error: string };
