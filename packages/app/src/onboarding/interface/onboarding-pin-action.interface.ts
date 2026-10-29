import { OnboardingPinActionTypeEnum } from '../enum/onboarding-pin-action-type.enum';
import { OnboardingPinPhaseEnum } from '../enum/onboarding-pin-phase.enum';

export type OnboardingPinActionInterface =
    | { readonly type: OnboardingPinActionTypeEnum.DIGIT_ENTERED; readonly digit: string }
    | { readonly type: OnboardingPinActionTypeEnum.DIGIT_DELETED }
    | { readonly type: OnboardingPinActionTypeEnum.ENTRY_RESTARTED; readonly phase: OnboardingPinPhaseEnum; readonly firstPin: string };
