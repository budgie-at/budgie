import { BudgetEntityInterface } from '@budgie/contracts';

import { budgetService } from '../service/budget.service';
import { isDefined } from '@rnw-community/shared';

interface PeriodDatesResult {
    startDate: Date;
    endDate: Date;
}

export const useBudgetPeriodDates = (budget: BudgetEntityInterface | null | undefined): PeriodDatesResult => {
    if (!isDefined(budget)) {
        return { startDate: new Date(), endDate: new Date() };
    }

    return budgetService.calculatePeriodDatesForType({
        period: budget.period,
        startDay: budget.startDay,
        referenceDate: new Date(),
        customStartDate: budget.customStartDate,
        customEndDate: budget.customEndDate
    });
};
