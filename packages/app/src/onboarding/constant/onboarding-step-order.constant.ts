import { OnboardingStepEnum } from '../enum/onboarding-step.enum';

export const ONBOARDING_STEP_ORDER: readonly OnboardingStepEnum[] = [
    OnboardingStepEnum.WELCOME,
    OnboardingStepEnum.TRACK,
    OnboardingStepEnum.BALANCES,
    OnboardingStepEnum.EXPENSE,
    OnboardingStepEnum.BUDGET,
    OnboardingStepEnum.LOCK,
    OnboardingStepEnum.AI,
    OnboardingStepEnum.DONE
];
