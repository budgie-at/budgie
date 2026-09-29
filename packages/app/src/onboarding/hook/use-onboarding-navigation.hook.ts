import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { ONBOARDING_STEP_ORDER } from '../constant/onboarding-step-order.constant';
import { OnboardingStepEnum } from '../enum/onboarding-step.enum';

export const useOnboardingNavigation = () => {
    const router = useRouter();

    const goToNextStep = (step: OnboardingStepEnum): void => {
        const currentIndex = ONBOARDING_STEP_ORDER.indexOf(step);
        const nextIndex = currentIndex + 1;
        const nextStep = ONBOARDING_STEP_ORDER[nextIndex];

        void appRuntime.runPromise(updateSettingsMutation({ onboardingStep: nextIndex })).catch((error: unknown) => {
            appRuntime.runFork(Effect.logError('persist step failed', { errorMessage: getErrorMessage(error), step, nextIndex }));
        });

        router.push(nextIndex === 0 ? '/onboarding' : `/onboarding/${nextStep.toLowerCase()}`);
    };

    const goToPreviousStep = (step: OnboardingStepEnum): void => {
        const currentIndex = ONBOARDING_STEP_ORDER.indexOf(step);

        if (currentIndex <= 0) {
            return;
        }

        const previousIndex = currentIndex - 1;
        const previousStep = ONBOARDING_STEP_ORDER[previousIndex];

        void appRuntime.runPromise(updateSettingsMutation({ onboardingStep: previousIndex })).catch((error: unknown) => {
            appRuntime.runFork(Effect.logError('persist step failed', { errorMessage: getErrorMessage(error), step, previousIndex }));
        });

        goBackOrReplace(previousIndex === 0 ? '/onboarding' : `/onboarding/${previousStep.toLowerCase()}`);
    };

    return { goToNextStep, goToPreviousStep };
};
