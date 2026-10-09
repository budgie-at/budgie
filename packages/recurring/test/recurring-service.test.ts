import { readFileSync } from 'node:fs';

import { resetTestDb } from '@budgie-at/test-kit';
import {
    AccountTypeEnum,
    LanguageEnum,
    TransactionEntityTable,
    CASH_WITHDRAWAL_TRACKED_CATEGORY_ID,
    PRECISION,
    RecurringSeriesKindEnum,
    RecurringSeriesStatusEnum,
    RecurringSeriesUserStateEnum
} from '@budgie/contracts';
import { afterAll, beforeEach, expect, layer } from '@effect/vitest';
import { between } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { RecurringAlertEnum, RecurringService } from '../src/index';
import { RecurringRepository } from '../src/repository/recurring.repository';

import { TestLayer, testDb, testDbHandle, testSeedService } from './test-context';

import type { RecurringCalendarDataInterface } from '../src/index';
import type { AccountCreateEntityInterface, RecurringSeriesCreateEntityInterface } from '@budgie/contracts';

const NOW = new Date(2026, 5, 15, 12);
const JUNE = 5;
const JULY = 6;
const DEFAULT_INSTRUMENT_ID = 1;

const seedCharges = Effect.fnUntraced(function* (accountInput: Partial<AccountCreateEntityInterface> = {}) {
    const { id: accountId } = yield* testSeedService.account({ instrumentId: DEFAULT_INSTRUMENT_ID, ...accountInput });
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

const calendarAsOf = (month: number, now: Date) => Effect.flatMap(RecurringService, service => service.calendar(2026, month, now));

const allEntries = (data: RecurringCalendarDataInterface) =>
    [...data.entriesByDay.values(), ...data.forecastedEntriesByDay.values()].flat();

const forecastedAmounts = (data: RecurringCalendarDataInterface, day: number) =>
    (data.forecastedEntriesByDay.get(day) ?? []).map(entry => entry.latestAmount).sort((first, second) => first - second);

const seedSavedSeries = (
    input: Pick<RecurringSeriesCreateEntityInterface, 'merchantKey' | 'title' | 'amount' | 'userState' | 'lastSeenAt'>
) =>
    Effect.flatMap(RecurringRepository, repository =>
        repository.createSeries({
            ...input,
            categoryId: null,
            kind: RecurringSeriesKindEnum.EXPENSE,
            periodDays: 30,
            status: RecurringSeriesStatusEnum.ACTIVE
        })
    );

const seedConcurrentSubscriptions = Effect.fnUntraced(function* (title: string) {
    const seed = yield* seedCharges();
    yield* seedMonthly(seed, title, 5, 5);
    yield* seedMonthly(seed, title, 20, 15);

    return seed;
});

const seedTrackedStreams = Effect.fnUntraced(function* (streams: readonly (readonly [number, number, RecurringSeriesUserStateEnum])[]) {
    const seed = yield* seedCharges();
    yield* Effect.forEach(
        [5, 4, 3, 2],
        monthsAgo => Effect.forEach(streams, ([day, amount]) => seed('BILLING', monthsAgo, day, amount), { discard: true }),
        { discard: true }
    );
    const entries = allEntries(yield* calendarAsOf(4, new Date(2026, 3, 25)));
    const service = yield* RecurringService;
    const ids = yield* Effect.forEach(streams, ([, amount, userState]) => {
        const [entry] = entries.filter(item => item.latestAmount === amount * PRECISION);

        return Effect.as(
            Effect.andThen(service.setUserState(entry.seriesId, userState), service.rename(entry.seriesId, `Plan ${amount}`)),
            [amount, entry.seriesId] as const
        );
    });

    return { seed, ids: new Map(ids) };
});

const chargeAndRead = Effect.fnUntraced(function* (
    seed: Effect.Success<ReturnType<typeof seedCharges>>,
    months: readonly number[],
    survivors: readonly (readonly [number, number])[]
) {
    yield* Effect.forEach(
        months,
        monthsAgo => Effect.forEach(survivors, ([day, amount]) => seed('BILLING', monthsAgo, day, amount), { discard: true }),
        { discard: true }
    );
    const lastMonth = JUNE - months[months.length - 1];

    return allEntries(yield* calendarAsOf(lastMonth + 1, new Date(2026, lastMonth, 25)));
});

const seedTransitSubscription = Effect.fnUntraced(function* () {
    const seed = yield* seedCharges();
    yield* seedMonthly(seed, 'TRANSIT', 20, 83.4);
    const [entry] = allEntries(yield* calendar(JULY));

    return { seed, entry };
});

const seedTransitTickets = (seed: Effect.Success<ReturnType<typeof seedCharges>>) =>
    Effect.forEach([3, 12, 28], day => seed('TRANSIT', 1, day, 2.4), { discard: true });

const expectSuggestedEntries = (entries: ReturnType<typeof allEntries>) => {
    expect(entries).toHaveLength(2);
    expect(entries.every(entry => entry.userState === RecurringSeriesUserStateEnum.SUGGESTED)).toBe(true);
};

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

afterAll(() => testDbHandle.dispose());

layer(TestLayer)('recurringService', it => {
    for (const [scenario, streams, survivors, months, visible] of [
        [
            'a confirmed survivor at the same price after a dismissed sibling retires',
            [
                [5, 5, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 15, RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [[20, 15]],
            [1, 0],
            [15]
        ],
        [
            'a confirmed survivor whose price drops after a dismissed sibling retires',
            [
                [5, 5, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 15, RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [[20, 14.9]],
            [1, 0],
            [15]
        ],
        [
            'a confirmed survivor whose price drops later after a dismissed sibling retires',
            [
                [5, 5, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 15, RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [[20, 14.9]],
            [-1, -2, -3],
            [15]
        ],
        [
            'a confirmed survivor whose price rises after a dismissed sibling retires',
            [
                [5, 5, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 15, RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [[20, 17]],
            [-1, -2, -3],
            [15]
        ],
        [
            'a dismissed survivor whose price rises after a confirmed sibling retires',
            [
                [5, 15, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 5, RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [[5, 17]],
            [-1, -2, -3],
            []
        ],
        [
            'a dismissed survivor whose price falls after a confirmed sibling retires',
            [
                [5, 15, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 5, RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [[5, 12]],
            [-1, -2, -3],
            []
        ],
        [
            'a dismissed survivor whose price rises without a billing gap',
            [
                [5, 15, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 5, RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [[5, 17]],
            [1, 0, -1],
            []
        ],
        [
            'a dismissed survivor after two confirmed siblings retire',
            [
                [5, 15, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 5, RecurringSeriesUserStateEnum.CONFIRMED],
                [10, 30, RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [[5, 17]],
            [-1, -2, -3],
            []
        ],
        [
            'a dismissed survivor sharing its billing day with a retired confirmed sibling',
            [
                [20, 15, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 5, RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [[20, 17]],
            [-1, -2, -3],
            []
        ],
        [
            'a confirmed survivor sharing its billing day with a retired dismissed sibling',
            [
                [20, 15, RecurringSeriesUserStateEnum.CONFIRMED],
                [20, 5, RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [[20, 17]],
            [-1, -2, -3],
            [15]
        ],
        [
            'a confirmed survivor after two dismissed siblings retire',
            [
                [20, 15, RecurringSeriesUserStateEnum.CONFIRMED],
                [5, 5, RecurringSeriesUserStateEnum.DISMISSED],
                [10, 30, RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [[20, 17]],
            [-1, -2, -3],
            [15]
        ],
        [
            'a confirmed survivor nearer in price to a retired dismissed sibling',
            [
                [20, 15, RecurringSeriesUserStateEnum.CONFIRMED],
                [5, 20, RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [[20, 18]],
            [-1, -2, -3],
            [15]
        ],
        [
            'a dismissed survivor whose price rises after a dismissed sibling retires',
            [
                [5, 5, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 15, RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [[20, 17]],
            [-1, -2, -3],
            []
        ],
        [
            'a dismissed survivor whose price falls after a dismissed sibling retires',
            [
                [5, 5, RecurringSeriesUserStateEnum.DISMISSED],
                [20, 15, RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [[20, 12]],
            [-1, -2, -3],
            []
        ],
        [
            'concurrent streams that both change price',
            [
                [5, 5, RecurringSeriesUserStateEnum.CONFIRMED],
                [20, 15, RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [
                [5, 6],
                [20, 17]
            ],
            [-1, -2, -3],
            [5]
        ],
        [
            'a confirmed stream beside a dismissed sibling that moves to its billing day',
            [
                [20, 15, RecurringSeriesUserStateEnum.CONFIRMED],
                [5, 5, RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [
                [20, 15],
                [20, 6]
            ],
            [-1, -2, -3],
            [null, 15]
        ],
        ['a single dismissed stream whose price band changes', [[20, 15, RecurringSeriesUserStateEnum.DISMISSED]], [[20, 17]], [1, 0], []],
        [
            'a single dismissed stream whose price drifts',
            [[20, 15, RecurringSeriesUserStateEnum.DISMISSED]],
            [[20, 14.9]],
            [-1, -2, -3],
            []
        ],
        ['a single dismissed stream whose price rises', [[20, 15, RecurringSeriesUserStateEnum.DISMISSED]], [[20, 17]], [-1, -2, -3], []],
        ['a single dismissed stream whose price falls', [[20, 15, RecurringSeriesUserStateEnum.DISMISSED]], [[20, 12]], [-1, -2, -3], []],
        [
            'a single dismissed stream whose billing day shifts',
            [[20, 15, RecurringSeriesUserStateEnum.DISMISSED]],
            [[22, 15]],
            [-1, -2, -3],
            []
        ],
        [
            'a single dismissed stream that moves its billing day and price band together',
            [[5, 15, RecurringSeriesUserStateEnum.DISMISSED]],
            [[20, 14.9]],
            [1, 0, -1, -2, -3, -4],
            [null]
        ],
        [
            'a single dismissed stream resuming after a gap',
            [[20, 15, RecurringSeriesUserStateEnum.DISMISSED]],
            [[20, 15]],
            [-2, -3, -4],
            []
        ],
        [
            'a single dismissed stream resuming after a gap at a new price',
            [[20, 15, RecurringSeriesUserStateEnum.DISMISSED]],
            [[20, 17]],
            [-2, -3, -4],
            []
        ]
    ] as const) {
        it.effect(`resolves the persisted identity of ${scenario}`, () =>
            Effect.gen(function* () {
                const { seed, ids } = yield* seedTrackedStreams(streams);
                const after = yield* chargeAndRead(seed, months, survivors);
                expect(after.map(entry => [entry.seriesId, entry.title, entry.userState])).toEqual(
                    visible.map(amount =>
                        isDefined(amount)
                            ? [ids.get(amount), `Plan ${amount}`, RecurringSeriesUserStateEnum.CONFIRMED]
                            : [expect.any(Number), 'BILLING', RecurringSeriesUserStateEnum.SUGGESTED]
                    )
                );
            })
        );
    }

    for (const [scenario, savedRows, months, survivor, expected] of [
        [
            'a confirmed row last seen across a calendar-month boundary',
            [
                [15, new Date(2026, 0, 1), RecurringSeriesUserStateEnum.CONFIRMED],
                [5, new Date(2026, 0, 9), RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [6, 5, 4],
            [5, 14.9],
            ['Plan 15', RecurringSeriesUserStateEnum.CONFIRMED]
        ],
        [
            'nothing from equally near rows',
            [
                [10, new Date(2026, 2, 5), RecurringSeriesUserStateEnum.DISMISSED],
                [20, new Date(2026, 2, 5), RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [2, 1, 0],
            [5, 15],
            ['BILLING', RecurringSeriesUserStateEnum.SUGGESTED]
        ],
        [
            'nothing from equally near rows saved in reverse order',
            [
                [20, new Date(2026, 2, 5), RecurringSeriesUserStateEnum.CONFIRMED],
                [10, new Date(2026, 2, 5), RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [2, 1, 0],
            [5, 15],
            ['BILLING', RecurringSeriesUserStateEnum.SUGGESTED]
        ],
        [
            'nothing from confirmed rows off the billing cycle',
            [
                [5, new Date(2026, 0, 5), RecurringSeriesUserStateEnum.CONFIRMED],
                [15, new Date(2026, 0, 10), RecurringSeriesUserStateEnum.CONFIRMED]
            ],
            [2, 1, 0],
            [20, 40],
            ['BILLING', RecurringSeriesUserStateEnum.SUGGESTED]
        ],
        [
            'nothing from a dismissed row off the billing cycle',
            [
                [5, new Date(2026, 0, 5), RecurringSeriesUserStateEnum.CONFIRMED],
                [15, new Date(2026, 0, 10), RecurringSeriesUserStateEnum.DISMISSED]
            ],
            [2, 1, 0],
            [20, 40],
            ['BILLING', RecurringSeriesUserStateEnum.SUGGESTED]
        ]
    ] as const) {
        it.effect(`inherits ${scenario}`, () =>
            Effect.gen(function* () {
                const seed = yield* seedCharges();
                yield* Effect.forEach(
                    savedRows,
                    ([amount, lastSeenAt, userState]) =>
                        seedSavedSeries({
                            merchantKey: `EXPENSE|1|BILLING|${amount * PRECISION}`,
                            title: `Plan ${amount}`,
                            amount: amount * PRECISION,
                            userState,
                            lastSeenAt
                        }),
                    { discard: true }
                );
                const after = yield* chargeAndRead(seed, months, [survivor]);
                expect(after.map(entry => [entry.title, entry.userState])).toEqual([expected]);
            })
        );
    }

    for (const [scenario, userState, charges, expected] of [
        [
            'a weekly stream does not inherit a dismissed monthly row with its key',
            RecurringSeriesUserStateEnum.DISMISSED,
            [
                [0, 7],
                [0, 14],
                [0, 21],
                [0, 28]
            ],
            ['false|BILLING|SUGGESTED']
        ],
        [
            'a weekly stream does not inherit a confirmed monthly row with its key',
            RecurringSeriesUserStateEnum.CONFIRMED,
            [
                [0, 7],
                [0, 14],
                [0, 21],
                [0, 28]
            ],
            ['false|BILLING|SUGGESTED']
        ],
        [
            'a monthly stream keeps its dismissal across a same-price billing-day move',
            RecurringSeriesUserStateEnum.DISMISSED,
            [
                [2, 20],
                [1, 20],
                [0, 20]
            ],
            []
        ],
        [
            'a monthly stream keeps its confirmation across a same-price billing-day move',
            RecurringSeriesUserStateEnum.CONFIRMED,
            [
                [2, 20],
                [1, 20],
                [0, 20]
            ],
            ['true|Old bill|CONFIRMED']
        ]
    ] as const) {
        it.effect(scenario, () =>
            Effect.gen(function* () {
                const seed = yield* seedCharges();
                yield* Effect.forEach([14, 13, 12], monthsAgo => seed('BILLING', monthsAgo, 5, 40), { discard: true });
                const service = yield* RecurringService;
                const [entry] = allEntries(yield* service.calendar(2025, JULY, new Date(2025, JUNE, 25)));
                yield* Effect.andThen(service.setUserState(entry.seriesId, userState), service.rename(entry.seriesId, 'Old bill'));
                yield* Effect.forEach(charges, ([monthsAgo, day]) => seed('BILLING', monthsAgo, day, 40), { discard: true });
                const after = allEntries(yield* calendarAsOf(JULY, new Date(2026, JUNE, 29)));
                expect([...new Set(after.map(item => [item.seriesId === entry.seriesId, item.title, item.userState].join('|')))]).toEqual(
                    expected
                );
            })
        );
    }

    it.effect('keeps the real screenshot fixture active at month boundaries', () =>
        Effect.gen(function* () {
            yield* testSeedService.account({ instrumentId: DEFAULT_INSTRUMENT_ID });
            const fixture = yield* Effect.sync(() =>
                readFileSync('../../tests/app-tests/fixtures/screenshots/scenes/shared/recurring.sql', 'utf8')
            );
            for (const date of [
                '2026-10-31T12:00:00Z',
                '2026-02-28T12:00:00Z',
                '2028-02-29T12:00:00Z',
                '2026-04-30T12:00:00Z',
                '2026-10-01T12:00:00Z',
                '2026-10-14T12:00:00Z',
                '2026-10-15T06:00:00Z',
                '2026-10-15T13:00:00Z'
            ]) {
                yield* Effect.forEach(
                    fixture
                        .replaceAll("'now'", "'" + date + "'")
                        .split(';')
                        .filter(statement => statement.trim().length > 0),
                    statement => testDb.$client.unsafe(statement),
                    { discard: true }
                );
                const now = new Date(date);
                const transactions = yield* testDb
                    .select({ operatedAt: TransactionEntityTable.operatedAt })
                    .from(TransactionEntityTable)
                    .where(between(TransactionEntityTable.id, 2500, 2599));
                expect(transactions.every(transaction => transaction.operatedAt.getTime() <= now.getTime())).toBe(true);
                const data = yield* Effect.flatMap(RecurringService, service => service.calendar(now.getFullYear(), now.getMonth(), now));
                expect(data.committedMonthlyExpense).toBeGreaterThan(0);
                expect(allEntries(data).length).toBeGreaterThan(0);
            }
        })
    );

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

    it.effect('ignores monthly salary and forecasts only recurring expenses', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach(
                [6, 5, 4, 3, 2, 1],
                monthsAgo => Effect.andThen(seed('ACME SALARY', monthsAgo, 1, 3000, true), seed('SPOTIFY', monthsAgo, 20, 10)),
                { discard: true }
            );

            const data = yield* calendar(JULY);

            expect(forecastedAmounts(data, 1)).toEqual([]);
            expect(forecastedAmounts(data, 20)).toEqual([10 * PRECISION]);
            expect(data.forecastedTotalAmount).toBeCloseTo(10);
        })
    );

    it.effect('keeps P2P expense outflows eligible for recurring detection', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'P2P FAMILY SUPPORT', 20, 100);

            expect(forecastedAmounts(yield* calendar(JULY), 20)).toEqual([100 * PRECISION]);
        })
    );

    it.effect('does not merge unrelated descriptive variants through fuzzy matching', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seed('AREALIS WIEN MDID:123456', 4, 20, 50);
            yield* seed('AREALIS WIEN FILIALE', 3, 20, 50);
            yield* seed('AREALIS WIEN MDID:789012', 2, 20, 50);
            yield* seed('AREALIS WIEN FILIALE', 1, 20, 50);

            const data = yield* calendar(JUNE);

            expect(forecastedAmounts(data, 20)).toEqual([]);
        })
    );

    it.effect('keeps fixed same-day recurring charges at one merchant as separate streams', () =>
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

    it.effect('keeps different merchant descriptions distinct without fuzzy identity', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([6, 5, 4], monthsAgo => seed('A1', monthsAgo, 20, 25), { discard: true });
            yield* Effect.forEach([3, 2, 1], monthsAgo => seed('A1 Telekom Austria AG, WIEN', monthsAgo, 20, 25), { discard: true });

            const months = yield* Effect.forEach([0, 1, 2, 3, 4, JUNE, JULY], calendar);

            expect(new Set(months.flatMap(allEntries).map(entry => entry.seriesId)).size).toBe(2);
            expect(forecastedAmounts(months[months.length - 1], 20)).toEqual([25 * PRECISION]);
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

    it.effect('forecasts variable utility bills with a proven bimonthly cadence', () =>
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

            expect(forecastedAmounts(june, 20)).toEqual([]);
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
            yield* seed('SPOTIFY AB', 0, 20, 10);

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

    it.effect('rejects an unproven large price change', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([6, 5, 4, 3, 2], monthsAgo => seed('WIENER LINIEN', monthsAgo, 20, 33), { discard: true });
            yield* seed('WIENER LINIEN', 1, 20, 41.7);

            const data = yield* calendar(JULY);

            expect(data.forecastedEntriesByDay.size).toBe(0);
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

    it.effect('includes monthly cash-account payments and excludes inactive accounts', () =>
        Effect.gen(function* () {
            const inactive = yield* seedCharges({ isActive: false });
            const cash = yield* seedCharges({ type: AccountTypeEnum.CASH });
            const active = yield* seedCharges();
            yield* seedMonthly(inactive, 'INACTIVE', 20, 40);
            yield* seedMonthly(cash, 'CASH MONTHLY PAYMENT', 20, 50);
            yield* seedMonthly(active, 'ACTIVE', 20, 60);
            const data = yield* calendar(JULY);
            expect(
                allEntries(data)
                    .map(entry => entry.title)
                    .sort()
            ).toEqual(['ACTIVE', 'CASH MONTHLY PAYMENT']);
            expect(forecastedAmounts(data, 20)).toEqual([50 * PRECISION, 60 * PRECISION]);
            expect(data.committedMonthlyExpense).toBe(110);
        })
    );

    it.effect('rejects irregular cash-account shopping through the generic recurring rule', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges({ type: AccountTypeEnum.CASH });
            yield* Effect.forEach(
                [
                    [4, 2],
                    [4, 7],
                    [3, 28],
                    [2, 1]
                ],
                ([monthsAgo, day]) => seed('CASH SHOPPING', monthsAgo, day, 23.4),
                { discard: true }
            );
            const charges = yield* Effect.flatMap(RecurringRepository, repository =>
                repository.findCharges(DEFAULT_INSTRUMENT_ID, LanguageEnum.EN, new Date(2025, 0, 1))
            );
            expect(charges).toHaveLength(4);
            const months = yield* Effect.forEach([2, 3, 4, JUNE, JULY], calendar);
            expect(months.flatMap(allEntries)).toEqual([]);
            expect(months.map(data => data.committedMonthlyExpense)).toEqual([0, 0, 0, 0, 0]);
        })
    );

    it.effect('preserves a dismissed legacy identity after qualified detection', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'NETFLIX', 20, 12);
            yield* seedSavedSeries({
                merchantKey: 'NETFLIX',
                title: 'NETFLIX',
                amount: 12 * PRECISION,
                userState: RecurringSeriesUserStateEnum.DISMISSED,
                lastSeenAt: new Date(2026, 4, 20)
            });
            expect(allEntries(yield* calendar(JULY))).toEqual([]);
            expect(allEntries(yield* calendar(JULY))).toEqual([]);
        })
    );

    it.effect('does not inherit a confirmed legacy state into ambiguous amount streams', () =>
        Effect.gen(function* () {
            yield* seedConcurrentSubscriptions('APPLE');
            yield* seedSavedSeries({
                merchantKey: 'APPLE',
                title: 'Apple confirmed',
                amount: 5 * PRECISION,
                userState: RecurringSeriesUserStateEnum.CONFIRMED,
                lastSeenAt: new Date(2026, 4, 5)
            });
            const entries = allEntries(yield* calendar(JULY));
            expectSuggestedEntries(entries);
        })
    );

    it.effect('preserves a legacy dismissal across ambiguous split streams', () =>
        Effect.gen(function* () {
            yield* seedConcurrentSubscriptions('APPLE');
            yield* seedSavedSeries({
                merchantKey: 'APPLE',
                title: 'Apple dismissed',
                amount: 5 * PRECISION,
                userState: RecurringSeriesUserStateEnum.DISMISSED,
                lastSeenAt: new Date(2026, 4, 5)
            });
            expect(allEntries(yield* calendar(JULY))).toEqual([]);
        })
    );

    it.effect('keeps a dismissed lower-price stream dismissed beside another price band', () =>
        Effect.gen(function* () {
            const seed = yield* seedConcurrentSubscriptions('APPLE');
            const [entry] = allEntries(yield* calendar(JULY)).filter(item => item.dayOfMonth === 5);
            yield* Effect.flatMap(RecurringService, service =>
                service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.DISMISSED)
            );
            yield* seed('APPLE', 0, 5, 4.9);
            expect(allEntries(yield* calendar(JULY)).map(item => item.dayOfMonth)).toEqual([20]);
        })
    );

    it.effect('keeps confirmation and rename when a sibling price-band minimum decreases', () =>
        Effect.gen(function* () {
            const seed = yield* seedConcurrentSubscriptions('APPLE');
            const [entry] = allEntries(yield* calendar(JULY)).filter(item => item.dayOfMonth === 20);
            yield* Effect.flatMap(RecurringService, service =>
                Effect.andThen(
                    service.rename(entry.seriesId, 'Cloud storage'),
                    service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.CONFIRMED)
                )
            );
            yield* seed('APPLE', 0, 5, 4.9);
            yield* seed('APPLE', 0, 20, 14.9);
            const entries = allEntries(yield* calendar(JULY));
            expect(entries).toHaveLength(2);
            expect(entries.find(item => item.dayOfMonth === 20)).toMatchObject({
                seriesId: entry.seriesId,
                title: 'Cloud storage',
                userState: RecurringSeriesUserStateEnum.CONFIRMED
            });
        })
    );

    it.effect('reuses the spending predicate to exclude cash-tracked entries', () =>
        Effect.gen(function* () {
            const { id: accountId } = yield* testSeedService.account();
            yield* Effect.forEach(
                [3, 2, 1],
                monthsAgo =>
                    testSeedService.manualExpense({
                        accountId,
                        amount: 50 * PRECISION,
                        operatedAt: new Date(2026, JUNE - monthsAgo, 20),
                        title: 'CASH TRACKED',
                        categoryId: CASH_WITHDRAWAL_TRACKED_CATEGORY_ID
                    }),
                { discard: true }
            );
            expect(allEntries(yield* calendar(JULY))).toEqual([]);
        })
    );

    it.effect('preserves confirmation and rename when incidental tickets introduce a split', () =>
        Effect.gen(function* () {
            const { seed, entry } = yield* seedTransitSubscription();
            yield* Effect.flatMap(RecurringService, service =>
                Effect.andThen(
                    service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.CONFIRMED),
                    service.rename(entry.seriesId, 'Transit subscription')
                )
            );
            yield* seedTransitTickets(seed);
            const entries = allEntries(yield* calendar(JULY));
            expect(entries).toHaveLength(1);
            expect(entries[0]).toMatchObject({
                seriesId: entry.seriesId,
                title: 'Transit subscription',
                userState: RecurringSeriesUserStateEnum.CONFIRMED
            });
        })
    );

    it.effect('preserves a whole-stream dismissal when incidental tickets introduce a split', () =>
        Effect.gen(function* () {
            const { seed, entry } = yield* seedTransitSubscription();
            yield* Effect.flatMap(RecurringService, service =>
                service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.DISMISSED)
            );
            yield* seedTransitTickets(seed);
            expect(allEntries(yield* calendar(JULY))).toEqual([]);
        })
    );

    it.effect('preserves split-stream dismissal when recent subscriptions make the whole history qualify', () =>
        Effect.gen(function* () {
            const { seed } = yield* seedTransitSubscription();
            yield* seedTransitTickets(seed);
            const [entry] = allEntries(yield* calendar(JULY));
            yield* Effect.flatMap(RecurringService, service =>
                service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.DISMISSED)
            );
            yield* seedSavedSeries({
                merchantKey: 'EXPENSE|1||TRANSIT',
                title: 'Transit base',
                amount: 83.4 * PRECISION,
                userState: RecurringSeriesUserStateEnum.SUGGESTED,
                lastSeenAt: new Date(2026, 4, 20)
            });
            yield* Effect.forEach([0, -1, -2, -3], monthsAgo => seed('TRANSIT', monthsAgo, 20, 83.4), { discard: true });
            const data = yield* Effect.flatMap(RecurringService, service => service.calendar(2026, 10, new Date(2026, 9, 25)));
            expect(allEntries(data)).toEqual([]);
            expect(data.committedMonthlyExpense).toBe(0);
        })
    );

    it.effect('stable amount-cluster identities preserve user states across a small price change', () =>
        Effect.gen(function* () {
            const seed = yield* seedConcurrentSubscriptions('SUBSCRIPTIONS');
            const entries = allEntries(yield* calendar(JULY));
            yield* Effect.flatMap(RecurringService, service =>
                Effect.andThen(
                    service.setUserState(entries[0].seriesId, RecurringSeriesUserStateEnum.DISMISSED),
                    service.setUserState(entries[1].seriesId, RecurringSeriesUserStateEnum.CONFIRMED)
                )
            );
            yield* seed('SUBSCRIPTIONS', 0, 5, 5);
            yield* seed('SUBSCRIPTIONS', 0, 20, 16);
            const after = yield* Effect.flatMap(RecurringService, service => service.calendar(2026, JULY, new Date(2026, JUNE, 25)));
            expect(allEntries(after).map(entry => [entry.seriesId, entry.userState])).toEqual([
                [entries[1].seriesId, RecurringSeriesUserStateEnum.CONFIRMED]
            ]);
        })
    );

    it.effect('preserves confirmation and rename across a proven new price band', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'TRANSIT', 20, 33);
            const [entry] = allEntries(yield* calendar(JULY));
            yield* Effect.flatMap(RecurringService, service =>
                Effect.andThen(
                    service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.CONFIRMED),
                    service.rename(entry.seriesId, 'Transit subscription')
                )
            );
            yield* Effect.forEach([0, -1, -2], monthsAgo => seed('TRANSIT', monthsAgo, 20, 41.7), { discard: true });
            const data = yield* Effect.flatMap(RecurringService, service => service.calendar(2026, 9, new Date(2026, 8, 25)));
            expect(allEntries(data)).toHaveLength(1);
            expect(allEntries(data)[0]).toMatchObject({
                seriesId: entry.seriesId,
                title: 'Transit subscription',
                userState: RecurringSeriesUserStateEnum.CONFIRMED,
                latestAmount: 41.7 * PRECISION,
                alert: RecurringAlertEnum.PRICE_CHANGE
            });
        })
    );

    it.effect('preserves dismissal across a fixed to variable bill transition', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'ENERGY', 20, 40);
            const [entry] = allEntries(yield* calendar(JULY));
            yield* Effect.flatMap(RecurringService, service =>
                service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.DISMISSED)
            );
            yield* Effect.forEach([55, 62, 69, 76].entries(), ([index, amount]) => seed('ENERGY', -index, 20, amount), { discard: true });
            const data = yield* Effect.flatMap(RecurringService, service => service.calendar(2026, 10, new Date(2026, 9, 25)));
            expect(data.entriesByDay.size).toBe(0);
            expect(data.forecastedEntriesByDay.size).toBe(0);
            expect(data.committedMonthlyExpense).toBe(0);
        })
    );

    it.effect('preserves a saved canonical key from before category boundaries were removed', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'NETFLIX', 20, 12);
            const saved = yield* seedSavedSeries({
                merchantKey: 'EXPENSE|1||NETFLIX',
                title: 'Streaming',
                amount: 12 * PRECISION,
                userState: RecurringSeriesUserStateEnum.CONFIRMED,
                lastSeenAt: new Date(2026, 4, 20)
            });
            expect(allEntries(yield* calendar(JULY)).map(entry => [entry.seriesId, entry.title, entry.userState])).toEqual([
                [saved.id, 'Streaming', RecurringSeriesUserStateEnum.CONFIRMED]
            ]);
        })
    );

    it.effect('keeps confirmation on the original stream when another stream qualifies', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthly(seed, 'BILLING', 5, 5);
            const [entry] = allEntries(yield* calendar(JULY));
            yield* Effect.flatMap(RecurringService, service =>
                service.setUserState(entry.seriesId, RecurringSeriesUserStateEnum.CONFIRMED)
            );
            yield* seedMonthly(seed, 'BILLING', 20, 15);
            const entries = allEntries(yield* calendar(JULY));
            expect(entries).toHaveLength(2);
            expect(entries.find(item => item.seriesId === entry.seriesId)?.userState).toBe(RecurringSeriesUserStateEnum.CONFIRMED);
            expect(entries.find(item => item.seriesId !== entry.seriesId)?.userState).toBe(RecurringSeriesUserStateEnum.SUGGESTED);
        })
    );

    it.effect('does not inherit a currency-less legacy confirmation into two native-currency streams', () =>
        Effect.gen(function* () {
            const firstCurrency = yield* seedCharges();
            const secondCurrency = yield* seedCharges({ instrumentId: 2 });
            yield* seedMonthly(firstCurrency, 'NETFLIX', 20, 12);
            yield* seedMonthly(secondCurrency, 'NETFLIX', 20, 12);
            yield* seedSavedSeries({
                merchantKey: 'NETFLIX',
                title: 'NETFLIX',
                amount: 12 * PRECISION,
                userState: RecurringSeriesUserStateEnum.CONFIRMED,
                lastSeenAt: new Date(2026, 4, 20)
            });
            const entries = allEntries(yield* calendar(JULY));
            expectSuggestedEntries(entries);
        })
    );

    it.effect('ignores income and sums only active expense commitments', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* Effect.forEach([6, 5, 4, 3, 2, 1], monthsAgo => seed('ACME SALARY', monthsAgo, 1, 3000, true), { discard: true });
            yield* seedMonthly(seed, 'NETFLIX', 20, 12);
            yield* Effect.forEach([9, 6, 3], monthsAgo => seed('INSURANCE CO', monthsAgo, 20, 30), { discard: true });
            yield* Effect.forEach([10, 9, 8, 7, 6, 5], monthsAgo => seed('OLD GYM', monthsAgo, 20, 40), { discard: true });

            const data = yield* calendar(JULY);

            expect(data.committedMonthlyExpense).toBeCloseTo(22);
            expect(allEntries(data).every(entry => entry.title !== 'ACME SALARY')).toBe(true);
        })
    );
});
