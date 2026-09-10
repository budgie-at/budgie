import { getLogger } from '@budgie/logger';
import { Href, router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { ONBOARDING_STEP_ORDER } from '../constant/onboarding-step-order.constant';
import { onboardingService } from '../service/onboarding.service';

const logger = getLogger('useOnboardingRedirect');

export const useOnboardingRedirect = (): Href | null => {
    const isOnboardingCompleted = useSetting('isOnboardingCompleted');
    const onboardingStep = useSetting('onboardingStep');
    const startFreshInstallRef = useRef(async () => {
        if (isOnboardingCompleted) {
            return;
        }

        if (await onboardingService.shouldStart()) {
            router.replace('/onboarding');
        }
    });

    // oxlint-disable-next-line react/exhaustive-deps -- mount-only fresh-install check; the ref captures the value at mount
    useEffect(() => {
        void startFreshInstallRef.current().catch((error: unknown) => {
            logger.error('fresh install check failed', { errorMessage: getErrorMessage(error) });
        });
    }, []);

    const resumedStep = ONBOARDING_STEP_ORDER[onboardingStep];

    if (isOnboardingCompleted || !isPositiveNumber(onboardingStep) || !isDefined(resumedStep)) {
        return null;
    }

    return `/onboarding/${resumedStep.toLowerCase()}`;
};
