import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';

export const useIsOnboardingActive = (): boolean => {
    const isOnboardingCompleted = useSetting('isOnboardingCompleted');
    const onboardingStep = useSetting('onboardingStep');
    const { data: accountCounts, updatedAt } = useDatabaseLiveQuery(accountRepository.count());

    if (!isDefined(updatedAt) || isOnboardingCompleted) {
        return false;
    }

    return isPositiveNumber(onboardingStep) || !isPositiveNumber(accountCounts.at(0)?.count);
};
