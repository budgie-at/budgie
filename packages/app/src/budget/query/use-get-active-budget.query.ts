import { BudgetRepository } from '@budgie/budget';
import { BudgetEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetActiveBudgetResult {
    readonly budget: BudgetEntityInterface | null;
    readonly isLoading: boolean;
}

const activeBudgetAtom = databaseQueryAtom(
    [BudgetEntityTable],
    Effect.flatMap(BudgetRepository, budgetRepository => budgetRepository.findActive())
);

export const useGetActiveBudgetQuery = (): UseGetActiveBudgetResult => {
    const result = useLiveAtomValue(activeBudgetAtom);

    if (AsyncResult.isInitial(result)) {
        return { budget: null, isLoading: true };
    }

    const budget = AsyncResult.getOrElse(result, () => null);

    return { budget: isDefined(budget) ? budget : null, isLoading: false };
};
