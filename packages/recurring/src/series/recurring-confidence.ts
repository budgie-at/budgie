import { isNotEmptyString } from '@rnw-community/shared';

import { RECURRING_AMOUNT_RATIO } from '../constant/recurring-amount-ratio.constant';
import { DAYS_PER_MONTH } from '../constant/recurring-days-per-month.constant';
import { RECURRING_HISTORY_MONTHS } from '../constant/recurring-history-months.constant';

import { nearestCycle } from './recurring-series';

import type { RecurringConfidenceInputInterface } from '../interface/recurring-confidence-input.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';

const MAX_CYCLES = 6;
const HISTORY_DAYS = RECURRING_HISTORY_MONTHS * DAYS_PER_MONTH;
const CYCLES_WEIGHT = 40;
const REGULARITY_WEIGHT = 20;
const STABILITY_WEIGHT = 20;
const IDENTITY_WEIGHT = 20;
const MISSED_CYCLE_PENALTY = 20;
const STABILITY_SPREAD = 0.2;
const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/u;

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

export const scoreRecurringConfidence = (input: RecurringConfidenceInputInterface): number => {
    const achievable = Math.min(MAX_CYCLES, Math.floor(HISTORY_DAYS / input.periodDays));
    const cycles = clampUnit((Math.min(input.cycleCount, achievable) - 1) / Math.max(achievable - 1, 1));
    const regularity = clampUnit(1 - input.meanDeviationDays / input.toleranceDays);
    const stability = input.isVariable
        ? 1
        : clampUnit(1 - (input.maximumAmount - input.minimumAmount) / Math.max(input.minimumAmount, 1) / STABILITY_SPREAD);
    const identity = input.hasIban ? 1 : 0;
    const score =
        cycles * CYCLES_WEIGHT +
        regularity * REGULARITY_WEIGHT +
        stability * STABILITY_WEIGHT +
        identity * IDENTITY_WEIGHT -
        input.missedCycles * MISSED_CYCLE_PENALTY;

    return Math.round(Math.min(100, Math.max(0, score)));
};

export const scoreDetectedSeries = (series: RecurringSeriesInterface): number => {
    const anchor = new Date(series.anchorTimestamp);
    const cycles = series.events.map(event => nearestCycle(anchor, new Date(event.timestamp), series));
    const amounts = series.events.map(event => event.nativeAmount);
    const minimumAmount = Math.min(...amounts);
    const maximumAmount = Math.max(...amounts);
    const cycleIndexes = cycles.map(candidate => candidate.cycle);
    const identitySegment = series.merchantKey.split('|')[2] ?? '';

    return scoreRecurringConfidence({
        periodDays: series.periodDays,
        cycleCount: series.events.length,
        meanDeviationDays: cycles.reduce((total, candidate) => total + candidate.deviation, 0) / cycles.length,
        toleranceDays: series.toleranceDays,
        minimumAmount,
        maximumAmount,
        hasIban: isNotEmptyString(identitySegment) && IBAN_PATTERN.test(identitySegment),
        isVariable: maximumAmount > minimumAmount * RECURRING_AMOUNT_RATIO,
        missedCycles: Math.max(0, Math.max(...cycleIndexes) - Math.min(...cycleIndexes) + 1 - new Set(cycleIndexes).size)
    });
};
