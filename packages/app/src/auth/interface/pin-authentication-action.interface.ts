import { PinAuthenticationActionTypeEnum } from '../enum/pin-authentication-action-type.enum';

export type PinAuthenticationActionInterface =
    | { readonly type: PinAuthenticationActionTypeEnum.DIGIT_ENTERED; readonly digit: string }
    | { readonly type: PinAuthenticationActionTypeEnum.DIGIT_DELETED }
    | { readonly type: PinAuthenticationActionTypeEnum.ATTEMPT_STARTED }
    | { readonly type: PinAuthenticationActionTypeEnum.ATTEMPT_ENDED; readonly shouldClearInput: boolean };
