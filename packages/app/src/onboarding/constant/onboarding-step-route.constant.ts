import { OnboardingStepEnum } from '../enum/onboarding-step.enum';

import type { Href } from 'expo-router';

export const ONBOARDING_STEP_ROUTE: Record<OnboardingStepEnum, Href> = {
    [OnboardingStepEnum.KEY]: '/onboarding/key',
    [OnboardingStepEnum.PIN]: '/onboarding/pin',
    [OnboardingStepEnum.SEAL]: '/onboarding/seal',
    [OnboardingStepEnum.SEALED]: '/onboarding/sealed',
    [OnboardingStepEnum.PHONE_LOCK]: '/onboarding/phone-lock',
    [OnboardingStepEnum.ACCOUNTS]: '/onboarding/accounts',
    [OnboardingStepEnum.BALANCES]: '/onboarding/balances',
    [OnboardingStepEnum.AI]: '/onboarding/ai'
};
