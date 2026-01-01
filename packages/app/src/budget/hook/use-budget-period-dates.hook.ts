import { BudgetEntityInterface } from '@budgie/contracts';
import { useMemo } from 'react';

import { budgetService } from '../service/budget.service';

interface PeriodDatesResult {
    startDate: Date;
    endDate: Date;
}

export const useBudgetPeriodDates = (budget: BudgetEntityInterface | null | undefined): PeriodDatesResult => useMemo(() => {
        if (!budget) {
            return { startDate: new Date(), endDate: new Date() };
        }

        return budgetService.calculatePeriodDatesForType({
            period: budget.period,
            startDay: budget.startDay,
            referenceDate: new Date(),
            customStartDate: budget.customStartDate,
            customEndDate: budget.customEndDate
        });
    }, [budget]);

