import { BudgetPeriodEnum } from '@budgie/contracts';

import { formatMonthYear } from './format-month-year.util';

const WEEK_PREFIX = 'Week of ';

const formatWeekLabel = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

    return WEEK_PREFIX + date.toLocaleDateString('en-US', options);
};

export const formatPeriodLabel = (period: BudgetPeriodEnum, startDate: Date): string => {
    if (period === BudgetPeriodEnum.WEEKLY) {
        return formatWeekLabel(startDate);
    }

    return formatMonthYear(startDate);
};

