import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { ONBOARDING_STEP_ROUTE } from '../constant/onboarding-step-route.constant';
import { OnboardingStepEnum } from '../enum/onboarding-step.enum';
import { OnboardingService } from '../service/onboarding.service';

export const useOnboardingNavigation = () => {
    const router = useRouter();

    const goToStep = (step: OnboardingStepEnum): void => {
        router.push(ONBOARDING_STEP_ROUTE[step]);
    };

    const replaceWithStep = (step: OnboardingStepEnum): void => {
        router.replace(ONBOARDING_STEP_ROUTE[step]);
    };

    const goBack = (): void => {
        goBackOrReplace(ONBOARDING_STEP_ROUTE[OnboardingStepEnum.KEY]);
    };

    const completeOnboarding = (): void => {
        appRuntime.runFork(logAndContinue(Effect.flatMap(OnboardingService, onboardingService => onboardingService.complete())));
    };

    return { goToStep, replaceWithStep, goBack, completeOnboarding };
};
