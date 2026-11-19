import { DAYS_PER_MONTH } from './recurring-days-per-month.constant';

import type { RecurringCadenceInterface } from '../interface/recurring-cadence.interface';
export const CADENCES: readonly RecurringCadenceInterface[] = [
    {
        periodMonths: null,
        periodDays: 7,
        toleranceDays: 1,
        windowDays: 2,
        fixedCycles: 6,
        variableCycles: 8,
        jitteryFixedCycles: null,
        jitteryVariableCycles: null
    },
    {
        periodMonths: null,
        periodDays: 14,
        toleranceDays: 2,
        windowDays: 4,
        fixedCycles: 5,
        variableCycles: 6,
        jitteryFixedCycles: null,
        jitteryVariableCycles: null
    },
    {
        periodMonths: 1,
        periodDays: DAYS_PER_MONTH,
        toleranceDays: 4,
        windowDays: 7,
        fixedCycles: 4,
        variableCycles: 6,
        jitteryFixedCycles: 6,
        jitteryVariableCycles: 8
    },
    {
        periodMonths: 2,
        periodDays: DAYS_PER_MONTH * 2,
        toleranceDays: 7,
        windowDays: 10,
        fixedCycles: 4,
        variableCycles: 5,
        jitteryFixedCycles: 5,
        jitteryVariableCycles: null
    },
    {
        periodMonths: 3,
        periodDays: DAYS_PER_MONTH * 3,
        toleranceDays: 8,
        windowDays: 12,
        fixedCycles: 3,
        variableCycles: 4,
        jitteryFixedCycles: 4,
        jitteryVariableCycles: null
    },
    {
        periodMonths: 6,
        periodDays: DAYS_PER_MONTH * 6,
        toleranceDays: 10,
        windowDays: 14,
        fixedCycles: 3,
        variableCycles: 4,
        jitteryFixedCycles: 4,
        jitteryVariableCycles: null
    },
    {
        periodMonths: 12,
        periodDays: DAYS_PER_MONTH * 12,
        toleranceDays: 10,
        windowDays: 14,
        fixedCycles: 3,
        variableCycles: 3,
        jitteryFixedCycles: 3,
        jitteryVariableCycles: null
    }
];
