import { OnboardingPinPhaseEnum } from '../enum/onboarding-pin-phase.enum';

export interface OnboardingPinStateInterface {
    readonly phase: OnboardingPinPhaseEnum;
    readonly input: string;
    readonly firstPin: string;
}
