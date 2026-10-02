import { PRECISION } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer, testSeedService } from '../harness/test-context';

const NOW = new Date(2026, 5, 15, 12);
const JUNE = 5;
const JULY = 6;
const DEFAULT_INSTRUMENT_ID = 1;

const seedCharges = () => {
    const { id: accountId } = testSeedService.account({ instrumentId: DEFAULT_INSTRUMENT_ID });
    let sequence = 0;

    return (title: string, monthsAgo: number, day: number, amount: number, isIncome = false) => {
        const operatedAt = new Date(2026, JUNE - monthsAgo, day, 12);
        sequence += 1;
        const seed = isIncome
            ? testSeedService.bankPairIncome.bind(testSeedService)
            : testSeedService.bankPairExpense.bind(testSeedService);
        const transaction = seed({ externalId: `${title}-${sequence}`, operatedAt }, { accountId, amount: amount * PRECISION });
        testSeedService.updateTransaction(transaction.id, { title });
    };
};

const calendar = (month: number) => Effect.flatMap(RecurringService, service => service.calendar(2026, month, NOW));

const forecastedAmounts = (
    data: { readonly forecastedEntriesByDay: ReadonlyMap<number, readonly { readonly latestAmount: number }[]> },
    day: number
) => (data.forecastedEntriesByDay.get(day) ?? []).map(entry => entry.latestAmount).sort((first, second) => first - second);

layer(TestLayer)('recurringService', it => {
    it.effect('forecasts an active monthly subscription into the next month', () =>
        Effect.gen(function* () {
            const seed = seedCharges();
            [6, 5, 4, 3, 2, 1].forEach(monthsAgo => seed('NETFLIX', monthsAgo, 20, 12.99));

            const data = yield* calendar(JULY);

            expect(forecastedAmounts(data, 20)).toEqual([12.99 * PRECISION]);
            expect(data.forecastedTotalAmount).toBeCloseTo(12.99);
        })
    );

    it.effect('shows an ended subscription as history without forecasting it', () =>
        Effect.gen(function* () {
            const seed = seedCharges();
            [10, 9, 8, 7, 6, 5, 4].forEach(monthsAgo => seed('GYM', monthsAgo, 20, 30));

            const history = yield* calendar(1);
            const current = yield* calendar(JUNE);
            const next = yield* calendar(JULY);

            expect(history.entriesByDay.get(20)).toHaveLength(1);
            expect(history.totalAmount).toBeCloseTo(30);
            expect(current.forecastedEntriesByDay.size + next.forecastedEntriesByDay.size).toBe(0);
        })
    );

    it.effect('detects monthly salary separately and keeps it out of the expense total', () =>
        Effect.gen(function* () {
            const seed = seedCharges();
            [6, 5, 4, 3, 2, 1].forEach(monthsAgo => {
                seed('ACME SALARY', monthsAgo, 1, 3000, true);
                seed('SPOTIFY', monthsAgo, 20, 10);
            });

            const data = yield* calendar(JULY);

            expect(forecastedAmounts(data, 1)).toEqual([-3000 * PRECISION]);
            expect(forecastedAmounts(data, 20)).toEqual([10 * PRECISION]);
            expect(data.forecastedTotalAmount).toBeCloseTo(10);
        })
    );

    it.effect('merges renamed merchant variants into one series', () =>
        Effect.gen(function* () {
            const seed = seedCharges();
            seed('AREALIS WIEN MDID:123456', 4, 20, 50);
            seed('AREALIS WIEN FILIALE', 3, 20, 50);
            seed('AREALIS WIEN MDID:789012', 2, 20, 50);
            seed('AREALIS WIEN FILIALE', 1, 20, 50);

            const data = yield* calendar(JUNE);

            expect(forecastedAmounts(data, 20)).toEqual([50 * PRECISION]);
        })
    );

    it.effect('detects two subscriptions at one merchant with different prices', () =>
        Effect.gen(function* () {
            const seed = seedCharges();
            [6, 5, 4, 3, 2, 1].forEach(monthsAgo => {
                seed('APPLE.COM/BILL', monthsAgo, 10, 4.99);
                seed('APPLE.COM/BILL', monthsAgo, 10, 12.99);
            });

            const data = yield* calendar(JULY);

            expect(forecastedAmounts(data, 10)).toEqual([4.99 * PRECISION, 12.99 * PRECISION]);
        })
    );

    it.effect('ignores irregular shopping visits', () =>
        Effect.gen(function* () {
            const seed = seedCharges();
            [
                [4, 2],
                [4, 7],
                [3, 28],
                [2, 1]
            ].forEach(([monthsAgo, day]) => seed('SPAR WIEN', monthsAgo, day, 23.4));

            const months = yield* Effect.forEach([2, 3, 4, JUNE, JULY], calendar);

            expect(months.flatMap(data => [...data.entriesByDay.values(), ...data.forecastedEntriesByDay.values()])).toEqual([]);
        })
    );

    it.effect('keeps a variable bi-monthly utility as one series', () =>
        Effect.gen(function* () {
            const seed = seedCharges();
            [
                [7, 80],
                [5, 95],
                [3, 110],
                [1, 120]
            ].forEach(([monthsAgo, amount]) => seed('STADTWERKE WIEN', monthsAgo, 20, amount));

            const june = yield* calendar(JUNE);
            const july = yield* calendar(JULY);

            expect(june.forecastedEntriesByDay.size).toBe(0);
            expect(forecastedAmounts(july, 20)).toEqual([110 * PRECISION]);
        })
    );
});
