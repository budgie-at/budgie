import { PRECISION, RecurringSeriesKindEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { detectRecurringSeries, isSeriesActive } from '../src/series/recurring-series';

import type { RecurringChargeInterface } from '../src/interface/recurring-charge.interface';

const charge = (day: number, amount: number, title = 'APPLE', accountId = 1): RecurringChargeInterface => ({
    kind: RecurringSeriesKindEnum.EXPENSE,
    nativeAmount: amount * PRECISION,
    instrumentId: 1,
    counterpartyIban: null,
    transactionId: day * 100 + amount,
    operatedAt: new Date(2026, 0, day, 12),
    title,
    comment: '',
    defaultAmount: amount * PRECISION,
    accountId,
    categoryId: null,
    categoryTitle: null,
    categoryIcon: null
});

it.effect('finds five independent monthly prices at one merchant', () =>
    Effect.sync(() => {
        const charges = [3, 8, 13, 18, 23].flatMap(amount => [5, 36, 64, 95].map(day => charge(day, amount)));
        expect(
            detectRecurringSeries(charges)
                .map(series => series.nativeAmount)
                .sort((first, second) => first - second)
        ).toEqual([3, 8, 13, 18, 23].map(amount => amount * PRECISION));
        expect(detectRecurringSeries(charges).every(series => series.priceChangedAt === null)).toBe(true);
    })
);

it.effect('marks a proven sequential price band handoff', () =>
    Effect.sync(() => {
        const oldPrice = [5, 36, 64, 95].map(day => charge(day, 33, 'TRANSIT'));
        const newPrice = [125, 156, 184, 215].map(day => charge(day, 41.7, 'TRANSIT'));
        const series = detectRecurringSeries([...oldPrice, ...newPrice]);
        expect(series).toHaveLength(1);
        expect(series[0].nativeAmount).toBe(41.7 * PRECISION);
        expect(series[0].priceChangedAt).toBe(new Date(2026, 0, 125).getTime());
    })
);

it.effect('rejects two-event annual evidence inside a busy identity', () =>
    Effect.sync(() => {
        const annual = [5, 370].map(day => charge(day, 80, 'MARKET'));
        expect(detectRecurringSeries(annual)).toHaveLength(1);
        expect(detectRecurringSeries([...annual, charge(155, 12, 'MARKET')])).toEqual([]);
    })
);

it.effect('detects bimonthly and semiannual expense cycles', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([5, 66, 125, 186].map(day => charge(day, 40, 'UTILITY')))[0]?.periodMonths).toBe(2);
        expect(detectRecurringSeries([5, 186, 370].map(day => charge(day, 80, 'PREMIUM')))[0]?.periodMonths).toBe(6);
    })
);

it.effect('detects weekly biweekly quarterly and annual cycles', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([5, 12, 19, 26].map(day => charge(day, 10, 'WEEKLY')))[0]?.periodDays).toBe(7);
        expect(detectRecurringSeries([5, 19, 33, 47].map(day => charge(day, 15, 'BIWEEKLY')))[0]?.periodDays).toBe(14);
        expect(detectRecurringSeries([5, 95, 186, 278].map(day => charge(day, 25, 'QUARTERLY')))[0]?.periodMonths).toBe(3);
        expect(detectRecurringSeries([5, 370].map(day => charge(day, 80, 'ANNUAL')))[0]?.periodMonths).toBe(12);
    })
);

it.effect('compares month cycles against calendar dates across uneven months', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([1, 36, 60, 91].map(day => charge(day, 25, 'CALENDAR')))[0]?.periodMonths).toBe(1);
    })
);

it.effect('keeps a calendar cycle posted just after the month boundary', () =>
    Effect.sync(() => {
        const charges = [
            [2, 28],
            [3, 28],
            [5, 1],
            [5, 28],
            [6, 28],
            [7, 28]
        ].map(([month, day]) => ({
            ...charge(day, 25, 'CALENDAR'),
            operatedAt: new Date(2026, month, day, 12)
        }));
        expect(detectRecurringSeries(charges)).toHaveLength(1);
        expect(detectRecurringSeries(charges)[0].periodMonths).toBe(1);
    })
);

it.effect('rejects two charges assigned to the same calendar cycle', () =>
    Effect.sync(() => {
        const charges = [
            new Date(2026, 0, 28, 12),
            new Date(2026, 1, 1, 12),
            new Date(2026, 1, 28, 12),
            new Date(2026, 2, 28, 12),
            new Date(2026, 3, 28, 12)
        ].map((operatedAt, index) => ({ ...charge(index + 1, 25, 'CALENDAR'), operatedAt }));
        expect(detectRecurringSeries(charges)).toEqual([]);
    })
);

it.effect('accepts variable bills only with strong recent timing', () =>
    Effect.sync(() => {
        const series = detectRecurringSeries([5, 36, 64, 95, 125].map((day, index) => charge(day, 40 + index * 6, 'ENERGY')));
        expect(series).toHaveLength(1);
        expect(series[0].periodMonths).toBe(1);
        expect(detectRecurringSeries([5, 17, 52, 64, 110].map((day, index) => charge(day, 40 + index * 6, 'SHOPPING')))).toEqual([]);
        expect(
            detectRecurringSeries(
                [
                    [2025, 10, 80],
                    [2026, 0, 95],
                    [2026, 2, 110],
                    [2026, 4, 120]
                ].map(([year, month, amount]) => ({ ...charge(20, amount, 'STADTWERKE WIEN'), operatedAt: new Date(year, month, 20, 12) }))
            )[0]?.periodMonths
        ).toBe(2);
    })
);

it.effect('lets current variable evidence supersede an old fixed-price phase', () =>
    Effect.sync(() => {
        const oldFixed = [5, 36, 64].map(day => charge(day, 40, 'ENERGY'));
        const currentVariable = [125, 156, 184, 215].map((day, index) => charge(day, 55 + index * 7, 'ENERGY'));
        const series = detectRecurringSeries([...oldFixed, ...currentVariable]);
        expect(series).toHaveLength(1);
        expect(series[0].anchorTimestamp).toBe(new Date(2026, 0, 215).getTime());
    })
);

it.effect('keeps one missed cycle but rejects repeated missed cycles', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([5, 36, 95, 125, 156].map(day => charge(day, 20, 'RENT')))).toHaveLength(1);
        expect(detectRecurringSeries([5, 36, 95].map(day => charge(day, 20, 'RENT')))).toEqual([]);
        expect(detectRecurringSeries([5, 36, 95, 125].map(day => charge(day, 20, 'RENT')))).toEqual([]);
        expect(detectRecurringSeries([5, 64, 125, 156].map(day => charge(day, 20, 'RENT')))).toEqual([]);
    })
);

it.effect('accepts a restarted stream after three current cycles', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([5, 44, 159, 189, 221].map(day => charge(day, 2621, 'RENT')))).toHaveLength(1);
        expect(detectRecurringSeries([5, 44, 159, 189].map(day => charge(day, 2621, 'RENT')))).toEqual([]);
    })
);

it.effect('only collapses exact same-day account and native-amount duplicates', () =>
    Effect.sync(() => {
        const originals = [5, 36, 64, 95].map(day => charge(day, 20, 'COVER'));
        const duplicated = originals.flatMap(item => [item, { ...item, transactionId: item.transactionId + 1 }]);
        const series = detectRecurringSeries(duplicated);
        expect(series).toHaveLength(1);
        expect(series[0].nativeAmount).toBe(20 * PRECISION);
        expect(series[0].events).toHaveLength(originals.length);
        expect(detectRecurringSeries([...originals, ...originals.map(item => ({ ...item, accountId: 2 }))])).toEqual([]);
    })
);

it.effect('uses the same IBAN despite changing categories', () =>
    Effect.sync(() => {
        const charges = [5, 36, 64, 95].map((day, index) => ({
            ...charge(day, 25, 'UTILITY'),
            counterpartyIban: 'AT12 3456 7890',
            categoryId: index % 2 === 0 ? 12 : 13
        }));
        expect(detectRecurringSeries(charges)).toHaveLength(1);
    })
);

it.effect('uses the same evidence for ordinary P2P expenses', () =>
    Effect.sync(() => {
        const regular = [5, 36, 64, 95].map(day => ({ ...charge(day, 100, 'MAMA'), counterpartyIban: 'AT12 3456 7890' }));
        const irregular = [5, 18, 70, 95].map(day => ({ ...charge(day, 100, 'MAMA'), counterpartyIban: 'AT12 3456 7890' }));
        expect(detectRecurringSeries(regular)).toHaveLength(1);
        expect(detectRecurringSeries(irregular)).toEqual([]);
    })
);

it.effect('does not detect income passed directly to the detector', () =>
    Effect.sync(() => {
        expect(
            detectRecurringSeries([5, 36, 64, 95].map(day => ({ ...charge(day, 3000, 'SALARY'), kind: RecurringSeriesKindEnum.INCOME })))
        ).toEqual([]);
    })
);

it.effect('marks old streams inactive after one and a half cadences', () =>
    Effect.sync(() => {
        const [series] = detectRecurringSeries([5, 36, 64, 95].map(day => charge(day, 20, 'RENT')));
        expect(isSeriesActive(series, new Date(2026, 4, 1))).toBe(true);
        expect(isSeriesActive(series, new Date(2026, 4, 22))).toBe(false);
    })
);
