import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import type { BudgetQueryResultInterface } from '../interface/budget-query-result.interface';
import type { BudgetEntityInterface } from '@budgie/contracts';

export const resolveBudgetQueryResult = <E>(
    result: AsyncResult.AsyncResult<BudgetEntityInterface | null | undefined, E>
): BudgetQueryResultInterface => {
    if (AsyncResult.isInitial(result)) {
        return { budget: null, isLoading: true };
    }

    const budget = AsyncResult.getOrElse(result, () => null);

    return { budget: isDefined(budget) ? budget : null, isLoading: false };
};
