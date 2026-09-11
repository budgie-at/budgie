import { Href, useIsFocused } from 'expo-router';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { ONBOARDING_STEP_ORDER } from '../constant/onboarding-step-order.constant';

export const useOnboardingRedirect = (): Href | null => {
    const isFocused = useIsFocused();
    const isOnboardingCompleted = useSetting('isOnboardingCompleted');
    const onboardingStep = useSetting('onboardingStep');
    const { data: accountCounts, updatedAt } = useDatabaseLiveQuery(accountRepository.count());

    if (!isFocused || !isDefined(updatedAt) || isOnboardingCompleted) {
        return null;
    }

    if (isPositiveNumber(onboardingStep)) {
        const resumedStep = ONBOARDING_STEP_ORDER[onboardingStep];

        return isDefined(resumedStep) ? `/onboarding/${resumedStep.toLowerCase()}` : null;
    }

    return isPositiveNumber(accountCounts.at(0)?.count) ? null : '/onboarding';
};
