import { DAYS_PER_MONTH } from './recurring-days-per-month.constant';

import type { RecurringCadenceInterface } from '../interface/recurring-cadence.interface';
export const CADENCES: readonly RecurringCadenceInterface[] = [
    { periodMonths: null, periodDays: 7, toleranceDays: 1, fixedCycles: 6, variableCycles: 8 },
    { periodMonths: null, periodDays: 14, toleranceDays: 2, fixedCycles: 5, variableCycles: 6 },
    { periodMonths: 1, periodDays: DAYS_PER_MONTH, toleranceDays: 4, fixedCycles: 4, variableCycles: 6 },
    { periodMonths: 2, periodDays: DAYS_PER_MONTH * 2, toleranceDays: 7, fixedCycles: 4, variableCycles: 5 },
    { periodMonths: 3, periodDays: DAYS_PER_MONTH * 3, toleranceDays: 8, fixedCycles: 3, variableCycles: 4 },
    { periodMonths: 6, periodDays: DAYS_PER_MONTH * 6, toleranceDays: 10, fixedCycles: 3, variableCycles: 4 },
    { periodMonths: 12, periodDays: DAYS_PER_MONTH * 12, toleranceDays: 10, fixedCycles: 3, variableCycles: 3 }
];
