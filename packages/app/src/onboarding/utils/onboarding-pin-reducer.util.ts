import { OnboardingPinActionTypeEnum } from '../enum/onboarding-pin-action-type.enum';
import { OnboardingPinActionInterface } from '../interface/onboarding-pin-action.interface';
import { OnboardingPinStateInterface } from '../interface/onboarding-pin-state.interface';

export const onboardingPinReducer = (
    state: OnboardingPinStateInterface,
    action: OnboardingPinActionInterface
): OnboardingPinStateInterface => {
    if (action.type === OnboardingPinActionTypeEnum.DIGIT_ENTERED) {
        return { ...state, input: state.input + action.digit };
    }
    if (action.type === OnboardingPinActionTypeEnum.DIGIT_DELETED) {
        return { ...state, input: state.input.slice(0, -1) };
    }

    return { phase: action.phase, firstPin: action.firstPin, input: '' };
};
