import { BudgetPaceStatusEnum } from '@budgie/budget';
import { BudgetLimitSourceEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import { BUDGET_PACE_STATUS_LABEL } from '../constant/budget-pace-status-label.constant';
import { BUDGET_PACE_VARIANT } from '../constant/budget-pace-variant.constant';

import { computeProjectionAllocation } from './compute-projection-allocation.util';

import type { BudgetDisplayStatusInterface } from '../interface/budget-display-status.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

export const resolveBudgetDisplayStatus = (
    projection: Pick<BudgetProjectionInterface, 'overall' | 'other' | 'categories' | 'dailyAllowance'>,
    limitSource: BudgetLimitSourceEnum
): BudgetDisplayStatusInterface => {
    const { overall, dailyAllowance } = projection;
    const isSettledStatus = overall.status === BudgetPaceStatusEnum.OVER || overall.status === BudgetPaceStatusEnum.AHEAD;
    const isOverAssigned = limitSource !== BudgetLimitSourceEnum.FIXED && computeProjectionAllocation(projection).isOverAllocated;
    const isThinMargin = isDefined(overall.projectedEnd) && overall.limit - overall.projectedEnd < dailyAllowance;

    if (!isSettledStatus && (isOverAssigned || isThinMargin)) {
        return { tone: 'warning', label: msg`Tight`, isTight: true };
    }

    return { tone: BUDGET_PACE_VARIANT[overall.status], label: BUDGET_PACE_STATUS_LABEL[overall.status], isTight: false };
};
