import { WaitlistFormActionTypeEnum } from '../enum/waitlist-form-action-type.enum';

export type WaitlistFormActionInterface =
    | { readonly type: WaitlistFormActionTypeEnum.EMAIL_CHANGED; readonly email: string }
    | { readonly type: WaitlistFormActionTypeEnum.SUBMIT_STARTED }
    | { readonly type: WaitlistFormActionTypeEnum.SUBMIT_FAILED; readonly error: string }
    | { readonly type: WaitlistFormActionTypeEnum.SUBMIT_SUCCEEDED; readonly position: number };
