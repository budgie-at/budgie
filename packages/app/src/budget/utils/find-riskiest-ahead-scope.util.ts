import { BudgetAlertScopeEnum, BudgetPaceStatusEnum } from '@budgie/budget';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { BudgetAheadScopeInterface } from '../interface/budget-ahead-scope.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

export const findRiskiestAheadScope = (projection: BudgetProjectionInterface): BudgetAheadScopeInterface | null => {
    const candidates: BudgetAheadScopeInterface[] = [
        ...projection.categories.map(category => ({
            target: { scope: BudgetAlertScopeEnum.CATEGORY, categoryId: category.categoryId },
            scope: category
        })),
        { target: { scope: BudgetAlertScopeEnum.OTHER }, scope: projection.other }
    ].filter(candidate => isPositiveNumber(candidate.scope.limit) && candidate.scope.status === BudgetPaceStatusEnum.AHEAD);

    return candidates.reduce<BudgetAheadScopeInterface | null>(
        (riskiest, candidate) =>
            !isDefined(riskiest) || (candidate.scope.projectedRatio ?? 0) > (riskiest.scope.projectedRatio ?? 0) ? candidate : riskiest,
        null
    );
};
