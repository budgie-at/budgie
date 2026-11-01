import { computeEventWindow, computePeriodWindow } from '@budgie/budget';
import { BudgetKindEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { BudgetWindowSourceInterface } from '../interface/budget-window-source.interface';
import type { BudgetPeriodWindowInterface } from '@budgie/budget';

export const resolveBudgetWindow = (budget: BudgetWindowSourceInterface, now: Date): BudgetPeriodWindowInterface => {
    if (budget.kind === BudgetKindEnum.EVENT && isDefined(budget.startsAt) && isDefined(budget.endsAt)) {
        return computeEventWindow({ startsAt: budget.startsAt, endsAt: budget.endsAt });
    }

    return computePeriodWindow(budget, now);
};
