import { PRECISION, RecurringSeriesKindEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { detectRecurringSeries } from '../src/series/recurring-series';

import type { RecurringChargeInterface } from '../src/interface/recurring-charge.interface';

const charge = (month: number, day: number, amount: number, title: string): RecurringChargeInterface => ({
    kind: RecurringSeriesKindEnum.EXPENSE,
    nativeAmount: amount * PRECISION,
    instrumentId: 1,
    counterpartyIban: null,
    transactionId: month * 10_000 + day * 100 + Math.round(amount * 10),
    operatedAt: new Date(2026, month, day, 12),
    title,
    comment: '',
    defaultAmount: amount * PRECISION,
    accountId: 1,
    categoryId: null,
    categoryTitle: null,
    categoryIcon: null
});

const netflixCharges = (secondAmount: number) => [
    ...[0, 1, 2, 3, 4].map(month => charge(month, 5, 12, 'NETFLIX.COM 866-579')),
    ...[5, 6, 7].map(month => charge(month, 5, secondAmount, 'Netflix International B.V.'))
];

it.effect('continues a renamed monthly series after the descriptor changes', () =>
    Effect.sync(() => {
        const series = detectRecurringSeries(netflixCharges(12));

        expect(series).toHaveLength(1);
        expect(series[0].events).toHaveLength(8);
        expect(series[0].merchantKey).toContain('NETFLIX INTERNATIONAL B V');
        expect(series[0].labels).toContain('NETFLIX COM');
        expect(series[0].labels).toContain('NETFLIX INTERNATIONAL B V');
    })
);

it.effect('keeps same-cadence same-amount series on a different cycle day separate', () =>
    Effect.sync(() => {
        const series = detectRecurringSeries([
            ...[0, 1, 2, 3].map(month => charge(month, 20, 12, 'STREAMING ALPHA')),
            ...[4, 5, 6, 7].map(month => charge(month, 5, 12, 'STREAMING BETA'))
        ]);

        expect(series).toHaveLength(2);
    })
);

it.effect('does not continue a series when the amount jumps beyond five percent', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries(netflixCharges(15))).toHaveLength(2);
    })
);
