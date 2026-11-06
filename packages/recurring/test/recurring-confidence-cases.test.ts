import { PRECISION, RecurringSeriesKindEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { RECURRING_ACTIVE_CONFIDENCE } from '../src/constant/recurring-active-confidence.constant';
import { scoreDetectedSeries, scoreRecurringConfidence } from '../src/series/recurring-confidence';
import { detectRecurringSeries } from '../src/series/recurring-series';

import type { RecurringChargeInterface } from '../src/interface/recurring-charge.interface';

const IBAN = 'AT611904300234573201';

const charge = (date: Date, amount: number, counterpartyIban: string | null = null): RecurringChargeInterface => ({
    transactionId: date.getTime(),
    operatedAt: date,
    title: 'NETFLIX',
    comment: '',
    defaultAmount: amount * PRECISION,
    nativeAmount: amount * PRECISION,
    instrumentId: 1,
    counterpartyIban,
    kind: RecurringSeriesKindEnum.EXPENSE,
    accountId: 1,
    categoryId: null,
    categoryTitle: null,
    categoryIcon: null
});

const monthlyCharges = (amounts: readonly number[], counterpartyIban: string | null = null) =>
    amounts.map((amount, index) => charge(new Date(2026, index, 5, 12), amount, counterpartyIban));

const confidenceOf = (charges: readonly RecurringChargeInterface[]): number => {
    const [series] = detectRecurringSeries(charges);

    return scoreDetectedSeries(series);
};

it.effect('keeps three regular fixed monthly charges without an IBAN possible', () =>
    Effect.sync(() => {
        expect(confidenceOf(monthlyCharges([12, 12, 12]))).toBeLessThan(RECURRING_ACTIVE_CONFIDENCE);
    })
);

it.effect('activates four or more regular fixed monthly charges', () =>
    Effect.sync(() => {
        expect(confidenceOf(monthlyCharges([12, 12, 12, 12]))).toBeGreaterThanOrEqual(RECURRING_ACTIVE_CONFIDENCE);
        expect(confidenceOf(monthlyCharges([12, 12, 12, 12, 12, 12]))).toBeGreaterThanOrEqual(RECURRING_ACTIVE_CONFIDENCE);
    })
);

it.effect('activates three regular charges that share an IBAN identity', () =>
    Effect.sync(() => {
        expect(confidenceOf(monthlyCharges([12, 12, 12], IBAN))).toBeGreaterThanOrEqual(RECURRING_ACTIVE_CONFIDENCE);
    })
);

it.effect('activates a variable amount series with four regular cycles and demotes it after a missed cycle', () =>
    Effect.sync(() => {
        expect(confidenceOf(monthlyCharges([80, 95, 110, 120]))).toBeGreaterThanOrEqual(RECURRING_ACTIVE_CONFIDENCE);
        expect(
            scoreRecurringConfidence({
                cycleCount: 4,
                meanDeviationDays: 0,
                toleranceDays: 4,
                minimumAmount: 80,
                maximumAmount: 120,
                hasIban: false,
                isVariable: true,
                missedCycles: 1
            })
        ).toBeLessThan(RECURRING_ACTIVE_CONFIDENCE);
        const withMissedCycle = [0, 1, 3, 4].map(month => charge(new Date(2026, month, 5, 12), 80 + month * 15));
        expect(detectRecurringSeries(withMissedCycle)).toEqual([]);
    })
);

it.effect('activates two stable on-time yearly charges', () =>
    Effect.sync(() => {
        const yearly = [charge(new Date(2025, 0, 5, 12), 99), charge(new Date(2026, 0, 5, 12), 99)];

        expect(confidenceOf(yearly)).toBeGreaterThanOrEqual(RECURRING_ACTIVE_CONFIDENCE);
    })
);

it.effect('lowers confidence for jittery timing and uneven amounts', () =>
    Effect.sync(() => {
        const regular = confidenceOf(monthlyCharges([12, 12, 12, 12]));
        const jittery = confidenceOf([5, 8, 4, 7].map((day, index) => charge(new Date(2026, index, day, 12), 12)));
        const uneven = confidenceOf(monthlyCharges([12, 12.6, 12.2, 12.9]));

        expect(jittery).toBeLessThan(regular);
        expect(uneven).toBeLessThan(regular);
    })
);

it.effect('keeps irregular yearly observations possible', () =>
    Effect.sync(() => {
        expect(
            scoreRecurringConfidence({
                periodDays: 365,
                cycleCount: 2,
                meanDeviationDays: 10,
                toleranceDays: 10,
                minimumAmount: 99,
                maximumAmount: 120,
                hasIban: false,
                isVariable: false,
                missedCycles: 0
            })
        ).toBeLessThan(RECURRING_ACTIVE_CONFIDENCE);
    })
);
