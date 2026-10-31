import { BudgetPeriodEnum } from '@budgie/contracts';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfWeek } from 'date-fns/startOfWeek';

export const defaultPeriodAnchorDate = (period: BudgetPeriodEnum, now: Date): Date | null => {
    if (period === BudgetPeriodEnum.MONTHLY) {
        return null;
    }

    return period === BudgetPeriodEnum.YEARLY ? startOfDay(now) : startOfWeek(now, { weekStartsOn: 1 });
};
