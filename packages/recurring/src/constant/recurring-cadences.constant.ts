import { DAYS_PER_MONTH } from './recurring-days-per-month.constant';

import type { RecurringCadenceInterface } from '../interface/recurring-cadence.interface';
export const CADENCES: readonly RecurringCadenceInterface[] = [
    { periodMonths: null, periodDays: 7, toleranceDays: 1 },
    { periodMonths: null, periodDays: 14, toleranceDays: 2 },
    { periodMonths: 1, periodDays: DAYS_PER_MONTH, toleranceDays: 4 },
    { periodMonths: 2, periodDays: DAYS_PER_MONTH * 2, toleranceDays: 7 },
    { periodMonths: 3, periodDays: DAYS_PER_MONTH * 3, toleranceDays: 8 },
    { periodMonths: 6, periodDays: DAYS_PER_MONTH * 6, toleranceDays: 10 },
    { periodMonths: 12, periodDays: DAYS_PER_MONTH * 12, toleranceDays: 10 }
];
