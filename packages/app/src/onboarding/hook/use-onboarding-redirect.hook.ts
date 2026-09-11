import { Href, useIsFocused } from 'expo-router';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { ONBOARDING_STEP_ORDER } from '../constant/onboarding-step-order.constant';

import { useIsOnboardingActive } from './use-is-onboarding-active.hook';

export const useOnboardingRedirect = (): Href | null => {
    const isFocused = useIsFocused();
    const isOnboardingActive = useIsOnboardingActive();
    const onboardingStep = useSetting('onboardingStep');

    if (!isFocused || !isOnboardingActive) {
        return null;
    }

    if (!isPositiveNumber(onboardingStep)) {
        return '/onboarding';
    }

    const resumedStep = ONBOARDING_STEP_ORDER[onboardingStep];

    return isDefined(resumedStep) ? `/onboarding/${resumedStep.toLowerCase()}` : null;
};
