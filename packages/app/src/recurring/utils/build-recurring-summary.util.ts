import { RecurringCadenceUnitEnum, RecurringSeriesKindEnum } from '@budgie/contracts';
import { isBefore } from 'date-fns/isBefore';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import type { RecurringSummaryInterface } from '../interface/recurring-summary.interface';
import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

export const buildRecurringSummary = (series: readonly RecurringSeriesListItemInterface[], now: Date): RecurringSummaryInterface => {
    const active = series.filter(item => item.isActive);
    const expenses = active.filter(item => item.kind === RecurringSeriesKindEnum.EXPENSE);
    const income = active.filter(item => item.kind === RecurringSeriesKindEnum.INCOME);
    const nextPayment =
        expenses
            .filter(item => isDefined(item.nextDate) && !isBefore(item.nextDate, startOfDay(now)))
            .sort((left, right) => (left.nextDate?.getTime() ?? 0) - (right.nextDate?.getTime() ?? 0))
            .at(0) ?? null;

    return {
        committedMonthly: sum(expenses.map(item => item.monthlyEquivalent)),
        committedCount: expenses.length,
        hasAveragedBills: expenses.some(item => item.cadenceUnit !== RecurringCadenceUnitEnum.MONTH || item.cadenceInterval !== 1),
        nextPayment,
        incomeMonthly: sum(income.map(item => item.monthlyEquivalent))
    };
};
