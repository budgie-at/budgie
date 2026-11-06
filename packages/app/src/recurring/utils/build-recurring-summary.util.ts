import { RecurringSeriesKindEnum } from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { isBefore } from 'date-fns/isBefore';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import { RECURRING_DUE_SOON_DAYS } from '../constant/recurring-due-soon-days.constant';

import type { RecurringSummaryInterface } from '../interface/recurring-summary.interface';
import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

export const buildRecurringSummary = (series: readonly RecurringSeriesListItemInterface[], now: Date): RecurringSummaryInterface => {
    const active = series.filter(item => item.isActive);
    const expenses = active.filter(item => item.kind === RecurringSeriesKindEnum.EXPENSE);
    const income = active.filter(item => item.kind === RecurringSeriesKindEnum.INCOME);
    const horizon = addDays(startOfDay(now), RECURRING_DUE_SOON_DAYS);
    const dueSoon = expenses.filter(item => isDefined(item.nextDate) && isBefore(item.nextDate, horizon));

    return {
        committedMonthly: sum(expenses.map(item => item.monthlyEquivalent)),
        committedCount: expenses.length,
        dueSoonTotal: sum(dueSoon.map(item => item.amount)),
        dueSoonCount: dueSoon.length,
        incomeMonthly: sum(income.map(item => item.monthlyEquivalent))
    };
};
