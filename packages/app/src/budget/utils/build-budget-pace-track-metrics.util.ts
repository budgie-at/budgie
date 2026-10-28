import { BudgetPaceStatusEnum } from '@budgie/budget';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

const PERCENT_MULTIPLIER = 100;

const toPercent = (ratio: number): `${number}%` => `${Math.max(0, Math.min(1, ratio)) * PERCENT_MULTIPLIER}%`;

export const buildBudgetPaceTrackMetrics = (scope: BudgetProjectionScopeInterface) => {
    const spentRatio = Math.min(isPositiveNumber(scope.limit) ? scope.spent / scope.limit : scope.spent, 1);
    const upcomingRatio = isPositiveNumber(scope.limit) ? Math.min(scope.upcoming / scope.limit, 1 - spentRatio) : 0;

    return {
        spentStyle: { width: toPercent(spentRatio) },
        upcomingStyle: { width: toPercent(upcomingRatio) },
        todayStyle: { left: toPercent(scope.elapsedFraction) },
        ringStyle:
            isDefined(scope.projectedRatio) && scope.status !== BudgetPaceStatusEnum.TOO_EARLY
                ? { left: toPercent(scope.projectedRatio) }
                : null
    };
};
