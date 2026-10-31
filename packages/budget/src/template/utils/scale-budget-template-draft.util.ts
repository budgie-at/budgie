import { BudgetPeriodEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { BUDGET_NOMINAL_PERIOD_DAYS } from '../../period/constant/budget-nominal-period-days.constant';

import type { BudgetTemplateDraftInterface } from '../interface/budget-template-draft.interface';

export const scaleBudgetTemplateDraft = (draft: BudgetTemplateDraftInterface, period: BudgetPeriodEnum): BudgetTemplateDraftInterface => {
    if (period === BudgetPeriodEnum.MONTHLY) {
        return draft;
    }

    const factor = BUDGET_NOMINAL_PERIOD_DAYS[period] / BUDGET_NOMINAL_PERIOD_DAYS[BudgetPeriodEnum.MONTHLY];
    const scale = (amount: number): number => Math.round(amount * factor);
    const categoryLimits = draft.categoryLimits
        .map(limit => ({ ...limit, limitAmount: scale(limit.limitAmount) }))
        .filter(limit => isPositiveNumber(limit.limitAmount));
    const categoriesTotal = categoryLimits.reduce((total, limit) => total + limit.limitAmount, 0);

    return { overallLimit: Math.max(scale(draft.overallLimit), categoriesTotal), categoryLimits };
};
