import { BudgetRepository } from '@budgie/budget';
import { BudgetEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetEventBudgetResult {
    readonly budget: BudgetEntityInterface | null;
    readonly isLoading: boolean;
}

export const eventBudgetAtom = databaseQueryFamily([BudgetEntityTable], BudgetRepository, (budgetRepository, id: number) =>
    budgetRepository.findEvent(id)
);

export const useGetEventBudgetQuery = (id: number): UseGetEventBudgetResult => {
    const result = useLiveAtomValue(eventBudgetAtom(id));

    if (AsyncResult.isInitial(result)) {
        return { budget: null, isLoading: true };
    }

    const budget = AsyncResult.getOrElse(result, () => null);

    return { budget: isDefined(budget) ? budget : null, isLoading: false };
};
