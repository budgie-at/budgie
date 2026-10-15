import { Href, useIsFocused } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { ONBOARDING_STEP_ORDER } from '../constant/onboarding-step-order.constant';
import { ONBOARDING_STEP_ROUTE } from '../constant/onboarding-step-route.constant';
import { OnboardingStepEnum } from '../enum/onboarding-step.enum';

import { useIsOnboardingActive } from './use-is-onboarding-active.hook';

const PIN_ENTRY_STEPS: ReadonlySet<OnboardingStepEnum> = new Set([OnboardingStepEnum.PIN, OnboardingStepEnum.SEAL]);

const resolveResumeStep = (persistedStep: OnboardingStepEnum | undefined, isPinEnabled: boolean): OnboardingStepEnum => {
    if (!isDefined(persistedStep)) {
        return isPinEnabled ? OnboardingStepEnum.ACCOUNTS : OnboardingStepEnum.KEY;
    }

    if (isPinEnabled && PIN_ENTRY_STEPS.has(persistedStep)) {
        return OnboardingStepEnum.ACCOUNTS;
    }

    if (persistedStep === OnboardingStepEnum.SEAL) {
        return OnboardingStepEnum.PIN;
    }

    if (persistedStep === OnboardingStepEnum.SEALED && !isPinEnabled) {
        return OnboardingStepEnum.KEY;
    }

    return persistedStep;
};

export const useOnboardingRedirect = (): Href | null => {
    const isFocused = useIsFocused();
    const isOnboardingActive = useIsOnboardingActive();
    const onboardingStep = useSetting('onboardingStep');
    const isPinEnabled = useSetting('isPinEnabled');

    if (!isFocused || !isOnboardingActive) {
        return null;
    }

    const resumeStep = resolveResumeStep(ONBOARDING_STEP_ORDER.at(onboardingStep), isPinEnabled);

    return resumeStep === OnboardingStepEnum.KEY ? '/onboarding' : ONBOARDING_STEP_ROUTE[resumeStep];
};
