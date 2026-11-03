import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { accountCountAtom } from '../../account/query/use-search-accounts-grouped.query';
import { useSetting } from '../../settings/hook/use-setting.hook';

export { accountCountAtom };

export const useIsOnboardingActive = (): boolean => {
    const isOnboardingCompleted = useSetting('isOnboardingCompleted');
    const onboardingStep = useSetting('onboardingStep');
    const result = useLiveAtomValue(accountCountAtom);

    if (AsyncResult.isInitial(result) || isOnboardingCompleted) {
        return false;
    }

    const accountCounts = AsyncResult.getOrElse(result, () => []);

    return isPositiveNumber(onboardingStep) || !isPositiveNumber(accountCounts.at(0)?.count);
};

export const useIsOnboardingPending = (): boolean => {
    const isOnboardingCompleted = useSetting('isOnboardingCompleted');
    const result = useLiveAtomValue(accountCountAtom);

    return !isOnboardingCompleted && AsyncResult.isInitial(result);
};
