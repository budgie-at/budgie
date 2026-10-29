import { WaitlistFormActionTypeEnum } from '../enum/waitlist-form-action-type.enum';
import { WaitlistFormActionInterface } from '../interface/waitlist-form-action.interface';
import { WaitlistFormStateInterface } from '../interface/waitlist-form-state.interface';

export const waitlistFormReducer = (state: WaitlistFormStateInterface, action: WaitlistFormActionInterface): WaitlistFormStateInterface => {
    if (action.type === WaitlistFormActionTypeEnum.EMAIL_CHANGED) {
        return { ...state, email: action.email, error: '' };
    }
    if (action.type === WaitlistFormActionTypeEnum.SUBMIT_STARTED) {
        return { ...state, isLoading: true, error: '' };
    }
    if (action.type === WaitlistFormActionTypeEnum.SUBMIT_FAILED) {
        return { ...state, isLoading: false, error: action.error };
    }

    return { ...state, isLoading: false, position: action.position };
};
