import { PinSetupActionTypeEnum } from '../enum/pin-setup-action-type.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';

export type PinSetupActionInterface =
    | { readonly type: PinSetupActionTypeEnum.DIGIT_ADDED; readonly digit: string }
    | { readonly type: PinSetupActionTypeEnum.DIGIT_DELETED }
    | { readonly type: PinSetupActionTypeEnum.OLD_PIN_REJECTED }
    | { readonly type: PinSetupActionTypeEnum.OLD_PIN_VERIFIED }
    | { readonly type: PinSetupActionTypeEnum.NEW_PIN_ENTERED; readonly pin: string }
    | { readonly type: PinSetupActionTypeEnum.BIOMETRIC_REQUESTED }
    | { readonly type: PinSetupActionTypeEnum.PINS_MISMATCHED; readonly initialStep: PinSetupStepEnum; readonly error: string }
    | { readonly type: PinSetupActionTypeEnum.SAVE_FAILED; readonly error: string };
