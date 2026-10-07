import { resetTestDb } from '@budgie-at/test-kit';
import { PRECISION, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { afterAll, beforeEach, expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { RecurringAlertEnum, RecurringService } from '../src/index';

import { TestLayer, testDb, testDbHandle, testSeedService } from './test-context';

import type { RecurringCalendarDataInterface } from '../src/index';

const NOW = new Date(2026, 5, 15, 12);
const JUNE = 5;
const JULY = 6;
const DEFAULT_INSTRUMENT_ID = 1;

const seedCharges = Effect.fnUntraced(function* () {
    const { id: accountId } = yield* testSeedService.account({ instrumentId: DEFAULT_INSTRUMENT_ID });
    let sequence = 0;

    return Effect.fnUntraced(function* (title: string, monthsAgo: number, day: number, amount: number, isIncome = false) {
        const operatedAt = new Date(2026, JUNE - monthsAgo, day, 12);
        sequence += 1;
        const transaction = { externalId: `${title}-${sequence}`, operatedAt };
        const entry = { accountId, amount: amount * PRECISION };
        const { id } = yield* isIncome
            ? testSeedService.bankPairIncome(transaction, entry)
            : testSeedService.bankPairExpense(transaction, entry);
        yield* testSeedService.updateTransaction(id, { title });
    });
});

const seedMonthly = (seed: Effect.Success<ReturnType<typeof seedCharges>>, title: string, day: number, amount: number) =>
    Effect.forEach([6, 5, 4, 3, 2, 1], monthsAgo => seed(title, monthsAgo, day, amount), { discard: true });

const calendar = (month: number) => Effect.flatMap(RecurringService, service => service.calendar(2026, month, NOW));

const allEntries = (data: RecurringCalendarDataInterface) =>
    [...data.entriesByDay.values(), ...data.forecastedEntriesByDay.values()].flat();

const forecastedAmounts = (data: RecurringCalendarDataInterface, day: number) =>
    (data.forecastedEntriesByDay.get(day) ?? []).map(entry => entry.latestAmount).sort((first, second) => first - second);

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

afterAll(() => testDbHandle.dispose());

layer(TestLayer)('recurringService', it => {
    it.effect('forecasts an active monthly subscription into the next month', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([6, 5, 4, 3, 2, 1], monthsAgo => seed('NETFLIX', monthsAgo, 20, 12.99), { discard: true });

            const data = yield* calendar(JULY);

            expect(forecastedAmounts(data, 20)).toEqual([12.99 * PRECISION]);
            expect(data.forecastedTotalAmount).toBeCloseTo(12.99);
        })
    );

    it.effect('shows an ended subscription as history without forecasting it', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([10, 9, 8, 7, 6, 5, 4], monthsAgo => seed('GYM', monthsAgo, 20, 30), { discard: true });

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
            const seed = yield* seedCharges();
            yield* Effect.forEach(
                [6, 5, 4, 3, 2, 1],
                monthsAgo => Effect.andThen(seed('ACME SALARY', monthsAgo, 1, 3000, true), seed('SPOTIFY', monthsAgo, 20, 10)),
                { discard: true }
            );

            const data = yield* calendar(JULY);

            expect(forecastedAmounts(data, 1)).toEqual([-3000 * PRECISION]);
            expect(forecastedAmounts(data, 20)).toEqual([10 * PRECISION]);
            expect(data.forecastedTotalAmount).toBeCloseTo(10);
        })
    );

    it.effect('merges renamed merchant variants into one series', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seed('AREALIS WIEN MDID:123456', 4, 20, 50);
            yield* seed('AREALIS WIEN FILIALE', 3, 20, 50);
            yield* seed('AREALIS WIEN MDID:789012', 2, 20, 50);
            yield* seed('AREALIS WIEN FILIALE', 1, 20, 50);

            const data = yield* calendar(JUNE);

            expect(forecastedAmounts(data, 20)).toEqual([50 * PRECISION]);
        })
    );

    it.effect('detects two subscriptions at one merchant with different prices', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach(
                [4.99, 12.99],
                amount => Effect.forEach([6, 5, 4, 3, 2, 1], monthsAgo => seed('APPLE.COM/BILL', monthsAgo, 10, amount)),
                { discard: true }
            );

            const data = yield* calendar(JULY);

            expect(forecastedAmounts(data, 10)).toEqual([4.99 * PRECISION, 12.99 * PRECISION]);
        })
    );

    it.effect('keeps a merchant renamed from a short brand label in one series', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([6, 5, 4], monthsAgo => seed('A1', monthsAgo, 20, 25), { discard: true });
            yield* Effect.forEach([3, 2, 1], monthsAgo => seed('A1 Telekom Austria AG, WIEN', monthsAgo, 20, 25), { discard: true });

            const months = yield* Effect.forEach([0, 1, 2, 3, 4, JUNE, JULY], calendar);

            expect(new Set(months.flatMap(allEntries).map(entry => entry.seriesId)).size).toBe(1);
            expect(forecastedAmounts(months[months.length - 1], 20)).toEqual([25 * PRECISION]);
        })
    );

    it.effect('detects four subscriptions at one merchant within one amount band', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach(
                [
                    [3, 8.49],
                    [10, 8.99],
                    [18, 9.49],
                    [26, 9.99]
                ],
                ([day, amount]) => seedMonthly(seed, 'Apple', day, amount),
                { discard: true }
            );

            const data = yield* calendar(JULY);

            expect([3, 10, 18, 26].flatMap(day => forecastedAmounts(data, day))).toEqual(
                [8.49, 8.99, 9.49, 9.99].map(amount => amount * PRECISION)
            );
        })
    );

    it.effect('ignores visits that repeat at an interval matching no billing period', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([27, 18, 9, 0], monthsAgo => seed('EISSALON', monthsAgo, 10, 4.6), { discard: true });

            const months = yield* Effect.forEach([2, 4, JUNE, JULY, 9], calendar);

            expect(months.flatMap(allEntries)).toEqual([]);
        })
    );

    it.effect('keeps concurrent monthly series of a merchant and its extended label separate', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'A1', 5, 9.9);
            yield* seedMonthly(seed, 'A1 SHOP', 20, 31.5);

            const months = yield* Effect.forEach([2, 3, 4, JUNE, JULY], calendar);

            expect(new Set(months.flatMap(allEntries).map(entry => entry.seriesId)).size).toBe(2);
        })
    );

    it.effect('ignores irregular shopping visits', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach(
                [
                    [4, 2],
                    [4, 7],
                    [3, 28],
                    [2, 1]
                ],
                ([monthsAgo, day]) => seed('SPAR WIEN', monthsAgo, day, 23.4),
                { discard: true }
            );

            const months = yield* Effect.forEach([2, 3, 4, JUNE, JULY], calendar);

            expect(months.flatMap(data => [...data.entriesByDay.values(), ...data.forecastedEntriesByDay.values()])).toEqual([]);
        })
    );

    it.effect('keeps a variable bi-monthly utility as one series', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach(
                [
                    [7, 80],
                    [5, 95],
                    [3, 110],
                    [1, 120]
                ],
                ([monthsAgo, amount]) => seed('STADTWERKE WIEN', monthsAgo, 20, amount),
                { discard: true }
            );

            const june = yield* calendar(JUNE);
            const july = yield* calendar(JULY);

            expect(june.forecastedEntriesByDay.size).toBe(0);
            expect(forecastedAmounts(july, 20)).toEqual([110 * PRECISION]);
        })
    );

    it.effect('keeps a dismissed series dismissed across detection runs', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'NETFLIX', 20, 12.99);
            const [entry] = allEntries(yield* calendar(JULY));

            yield* Effect.flatMap(RecurringService, service =>
                service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.DISMISSED)
            );
            yield* seed('NETFLIX', 0, 14, 12.99);

            expect(allEntries(yield* calendar(JUNE))).toEqual([]);
            expect(allEntries(yield* calendar(JULY))).toEqual([]);
        })
    );

    it.effect('keeps a renamed and confirmed series across detection runs', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'SPOTIFY AB', 20, 10);
            const [entry] = allEntries(yield* calendar(JULY));

            yield* Effect.flatMap(RecurringService, service =>
                Effect.andThen(
                    service.rename(entry.seriesId, 'Music'),
                    service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.CONFIRMED)
                )
            );
            yield* seed('SPOTIFY AB', 0, 14, 10);

            expect(entry.userState).toBe(RecurringSeriesUserStateEnum.SUGGESTED);
            expect(allEntries(yield* calendar(JULY)).map(item => [item.seriesId, item.title, item.userState])).toEqual([
                [entry.seriesId, 'Music', RecurringSeriesUserStateEnum.CONFIRMED]
            ]);
        })
    );

    it.effect('flags an expected charge that did not arrive as overdue', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'NETFLIX', 5, 12.99);

            const data = yield* calendar(JUNE);

            expect(data.forecastedEntriesByDay.get(5)?.map(entry => entry.alert)).toEqual([RecurringAlertEnum.OVERDUE]);
        })
    );

    it.effect('flags a price step above five percent and forecasts the new price', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([6, 5, 4, 3, 2], monthsAgo => seed('WIENER LINIEN', monthsAgo, 20, 33), { discard: true });
            yield* seed('WIENER LINIEN', 1, 20, 41.7);

            const data = yield* calendar(JULY);

            expect(data.forecastedEntriesByDay.get(20)?.map(entry => [entry.latestAmount, entry.alert])).toEqual([
                [41.7 * PRECISION, RecurringAlertEnum.PRICE_CHANGE]
            ]);
        })
    );

    it.effect('flags a fare that moved to a new amount band months ago', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([9, 8, 7, 6, 5], monthsAgo => seed('WIENER LINIEN', monthsAgo, 5, 33), { discard: true });
            yield* Effect.forEach([4, 3, 2, 1], monthsAgo => seed('WIENER LINIEN', monthsAgo, 5, 41.7), { discard: true });

            const data = yield* calendar(JULY);

            expect(data.forecastedEntriesByDay.get(5)?.map(entry => [entry.latestAmount, entry.alert])).toEqual([
                [41.7 * PRECISION, RecurringAlertEnum.PRICE_CHANGE]
            ]);
        })
    );

    it.effect('sums committed monthly expense and income of active series', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([6, 5, 4, 3, 2, 1], monthsAgo => seed('ACME SALARY', monthsAgo, 1, 3000, true), { discard: true });
            yield* seedMonthly(seed, 'NETFLIX', 20, 12);
            yield* Effect.forEach([9, 6, 3], monthsAgo => seed('INSURANCE CO', monthsAgo, 20, 30), { discard: true });
            yield* Effect.forEach([10, 9, 8, 7, 6, 5], monthsAgo => seed('OLD GYM', monthsAgo, 20, 40), { discard: true });

            const data = yield* calendar(JULY);

            expect(data.committedMonthlyExpense).toBeCloseTo(22);
            expect(data.committedMonthlyIncome).toBeCloseTo(3000);
        })
    );
});
