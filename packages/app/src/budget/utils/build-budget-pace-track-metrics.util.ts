import { BudgetPaceStatusEnum } from '@budgie/budget';

import { isPositiveNumber } from '@rnw-community/shared';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

const PERCENT_MULTIPLIER = 100;
const MINIMUM_OVERFLOW_SHARE = 0.04;
const LABEL_EDGE_RATIO = 0.08;

const toPercent = (ratio: number): `${number}%` => `${Math.max(0, Math.min(1, ratio)) * PERCENT_MULTIPLIER}%`;

export const buildBudgetPaceTrackMetrics = (scope: BudgetProjectionScopeInterface) => {
    const isOverBudget = isPositiveNumber(scope.limit) && scope.spent > scope.limit;

    if (isOverBudget) {
        const overflowShare = Math.max(MINIMUM_OVERFLOW_SHARE, 1 - scope.limit / scope.spent);

        return {
            isOverBudget,
            neutralStyle: { flexGrow: 1 - overflowShare },
            fillStyle: { flexGrow: overflowShare },
            reservedStyle: null,
            markerStyle: { start: toPercent(1 - overflowShare) },
            labelStyle: { start: toPercent(Math.min(Math.max(1 - overflowShare, LABEL_EDGE_RATIO), 1 - LABEL_EDGE_RATIO)) }
        };
    }

    const spentRatio = Math.min(isPositiveNumber(scope.limit) ? scope.spent / scope.limit : scope.spent, 1);
    const upcomingRatio = isPositiveNumber(scope.limit) ? Math.min(scope.upcoming / scope.limit, 1 - spentRatio) : 0;
    const neutralRatio = scope.status === BudgetPaceStatusEnum.AHEAD ? Math.min(scope.elapsedFraction, spentRatio) : 0;

    return {
        isOverBudget,
        neutralStyle: { width: toPercent(neutralRatio) },
        fillStyle: { width: toPercent(spentRatio - neutralRatio) },
        reservedStyle: { width: toPercent(upcomingRatio) },
        markerStyle: { start: toPercent(scope.elapsedFraction) },
        labelStyle: { start: toPercent(Math.min(Math.max(scope.elapsedFraction, LABEL_EDGE_RATIO), 1 - LABEL_EDGE_RATIO)) }
    };
};
