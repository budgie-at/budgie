import { BudgetPaceStatusEnum } from '@budgie/budget';
import { BudgetLimitSourceEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { computeProjectionAllocation } from './compute-projection-allocation.util';

import type { BudgetProjectionInterface } from '@budgie/budget';

export const isBudgetTight = (
    projection: Pick<BudgetProjectionInterface, 'overall' | 'other' | 'categories' | 'dailyAllowance'>,
    limitSource: BudgetLimitSourceEnum
): boolean => {
    const { overall, dailyAllowance } = projection;

    if (overall.status === BudgetPaceStatusEnum.OVER || overall.status === BudgetPaceStatusEnum.AHEAD) {
        return false;
    }

    const isOverAssigned = limitSource !== BudgetLimitSourceEnum.FIXED && computeProjectionAllocation(projection).isOverAllocated;
    const isThinMargin = isDefined(overall.projectedEnd) && overall.limit - overall.projectedEnd < dailyAllowance;

    return isOverAssigned || isThinMargin;
};
