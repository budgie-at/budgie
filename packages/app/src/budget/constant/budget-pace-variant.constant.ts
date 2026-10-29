import { BudgetPaceStatusEnum } from '@budgie/budget';

import type { BudgetPaceVariant } from '../type/budget-pace-variant.type';

export const BUDGET_PACE_VARIANT: Record<BudgetPaceStatusEnum, BudgetPaceVariant> = {
    [BudgetPaceStatusEnum.ON_TRACK]: 'positive',
    [BudgetPaceStatusEnum.TOO_EARLY]: 'positive',
    [BudgetPaceStatusEnum.AHEAD]: 'warning',
    [BudgetPaceStatusEnum.OVER]: 'destructive'
};
