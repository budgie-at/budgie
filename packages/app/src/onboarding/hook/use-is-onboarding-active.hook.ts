import { AccountEntityTable, AccountRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

const accountCountAtom = databaseQueryAtom(
    [AccountEntityTable],
    Effect.flatMap(AccountRepository, accountRepository => accountRepository.count())
);

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
