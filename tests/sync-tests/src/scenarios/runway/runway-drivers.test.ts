import { aggregateRunwayDrivers } from '@app/runway/utils/aggregate-runway-drivers.util';
import { median } from '@app/runway/utils/median.util';
import {
    CategoryEntityTable,
    UserIconNameEnum,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    RUNWAY_WINDOW_MONTHS,
    RunwayDriverDimensionEnum,
    StatisticsRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { explainQueryPlan, requireInstrument, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { seed } from '../../harness/seed/seed';

import type { RunwayDriverBreakdownInterface } from '@app/runway/interface/runway-driver-breakdown.interface';
import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const REGULAR_MONTHLY_AMOUNT = 100 * PRECISION;
const ONE_OFF_AMOUNT = 60 * PRECISION;
const FIRST_TAIL_AMOUNT = PRECISION;
const SECOND_TAIL_AMOUNT = PRECISION / 2;
const UNTAGGED_AMOUNT = 40 * PRECISION;
const SEEDED_MONTHS = 4;

const seedCategory = (title: string) =>
    Effect.gen(function* () {
        return yield* insertOne(CategoryEntityTable, {
            title,
            titleSearch: title.toLowerCase(),
            icon: UserIconNameEnum.Wallet,
            parentId: null
        });
    });

const monthOperatedAt = (monthsAgo: number): Date => {
    const now = new Date();

    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 15, 12));
};

const seedExpense = (accountId: number, categoryId: number, amount: number, monthsAgo: number) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.EXPENSE,
            title: `Runway driver expense ${categoryId} ${monthsAgo}`,
            operatedAt: monthOperatedAt(monthsAgo),
            comment: '',
            toAccountId: null,
            fromAccountId: accountId,
            exchangeRate: 1,
            externalId: null,
            externalSource: ExternalSourceEnum.CSV,
            updatedBy: null
        } satisfies TransactionCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount,
            categoryId,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: null,
            baseExchangeRate: null,
            baseAmount: null,
            toIban: null
        } satisfies TransactionEntryCreateEntityInterface);

        return transaction.id;
    });

const seedScenario = Effect.fnUntraced(function* () {
    const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);

    return { instrumentId: hryvnia.id, accountId: (yield* seed.account({ instrumentId: hryvnia.id })).id };
});

const aggregate = Effect.fnUntraced(function* (dimension: RunwayDriverDimensionEnum, instrumentId: number) {
    const statisticsRepository = yield* StatisticsRepository;
    const seriesRows = yield* statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, RUNWAY_WINDOW_MONTHS);
    const monthlyBurn = median(seriesRows.map(row => row.expense));
    const driverRows = yield* statisticsRepository.getRunwayDriverSeriesQuery(
        DEFAULT_TRANSACTION_FILTER,
        instrumentId,
        dimension,
        RUNWAY_WINDOW_MONTHS,
        LanguageEnum.EN
    );
    const categoryRows = yield* statisticsRepository.getRunwayDriverSeriesQuery(
        DEFAULT_TRANSACTION_FILTER,
        instrumentId,
        RunwayDriverDimensionEnum.CATEGORY,
        RUNWAY_WINDOW_MONTHS,
        LanguageEnum.EN
    );

    return {
        drivers: aggregateRunwayDrivers(driverRows, monthlyBurn).drivers,
        irregularMonthlyAmount: aggregateRunwayDrivers(categoryRows, monthlyBurn).irregularMonthlyAmount
    } satisfies RunwayDriverBreakdownInterface;
});

describe('runway drivers', () => {
    it.effect('divides by months with data, flags only one-offs and folds the long tail', () =>
        Effect.gen(function* () {
            const { instrumentId, accountId } = yield* seedScenario();
            const regular = yield* seedCategory('Groceries');
            const oneOff = yield* seedCategory('Dentist');
            const firstTail = yield* seedCategory('Stamps');
            const secondTail = yield* seedCategory('Candles');

            yield* Effect.forEach(
                Array.from({ length: SEEDED_MONTHS }, (_, index) => index + 1),
                monthsAgo => seedExpense(accountId, regular.id, REGULAR_MONTHLY_AMOUNT, monthsAgo),
                { discard: true }
            );
            yield* seedExpense(accountId, oneOff.id, ONE_OFF_AMOUNT, 2);
            yield* seedExpense(accountId, firstTail.id, FIRST_TAIL_AMOUNT, 3);
            yield* seedExpense(accountId, secondTail.id, SECOND_TAIL_AMOUNT, 1);

            const { drivers, irregularMonthlyAmount } = yield* aggregate(RunwayDriverDimensionEnum.CATEGORY, instrumentId);

            expect(drivers).toStrictEqual([
                { id: regular.id, title: regular.title, monthlyAmount: REGULAR_MONTHLY_AMOUNT, isIrregular: false, foldedDriverCount: 0 },
                {
                    id: oneOff.id,
                    title: oneOff.title,
                    monthlyAmount: ONE_OFF_AMOUNT / SEEDED_MONTHS,
                    isIrregular: true,
                    foldedDriverCount: 0
                },
                {
                    id: null,
                    title: '',
                    monthlyAmount: (FIRST_TAIL_AMOUNT + SECOND_TAIL_AMOUNT) / SEEDED_MONTHS,
                    isIrregular: false,
                    foldedDriverCount: 2
                }
            ]);
            expect(irregularMonthlyAmount).toBe((ONE_OFF_AMOUNT + FIRST_TAIL_AMOUNT + SECOND_TAIL_AMOUNT) / SEEDED_MONTHS);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('counts secondary tags and untagged spend in the tag dimension without changing irregular spend', () =>
        Effect.gen(function* () {
            const { instrumentId, accountId } = yield* seedScenario();
            const regular = yield* seedCategory('Groceries');
            const oneOff = yield* seedCategory('Dentist');
            const tag = yield* seed.tag('Trip');
            const secondTag = yield* seed.tag('Health');

            yield* Effect.forEach(
                Array.from({ length: SEEDED_MONTHS }, (_, index) => index + 1),
                monthsAgo =>
                    Effect.gen(function* () {
                        const transactionId = yield* seedExpense(accountId, regular.id, REGULAR_MONTHLY_AMOUNT, monthsAgo);

                        yield* seed.transactionTag(transactionId, tag.id);
                    }),
                { discard: true }
            );
            yield* seedExpense(accountId, regular.id, UNTAGGED_AMOUNT, 1);
            const oneOffTransactionId = yield* seedExpense(accountId, oneOff.id, ONE_OFF_AMOUNT, 2);

            yield* seed.transactionTag(oneOffTransactionId, tag.id);
            yield* seed.transactionTag(oneOffTransactionId, secondTag.id);

            const tagBreakdown = yield* aggregate(RunwayDriverDimensionEnum.TAG, instrumentId);

            expect(tagBreakdown.drivers).toStrictEqual([
                {
                    id: tag.id,
                    title: 'Trip',
                    monthlyAmount: (REGULAR_MONTHLY_AMOUNT * SEEDED_MONTHS + ONE_OFF_AMOUNT) / SEEDED_MONTHS,
                    isIrregular: false,
                    foldedDriverCount: 0
                },
                {
                    id: secondTag.id,
                    title: 'Health',
                    monthlyAmount: ONE_OFF_AMOUNT / SEEDED_MONTHS,
                    isIrregular: true,
                    foldedDriverCount: 0
                },
                { id: null, title: '', monthlyAmount: UNTAGGED_AMOUNT / SEEDED_MONTHS, isIrregular: true, foldedDriverCount: 0 }
            ]);
            expect(tagBreakdown.irregularMonthlyAmount).toBe(ONE_OFF_AMOUNT / SEEDED_MONTHS);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('runway month window predicate', () => {
    it.effect('selects the same transactions as the previous strftime-based window and uses the visible/operated index', () =>
        Effect.gen(function* () {
            const { instrumentId, accountId } = yield* seedScenario();
            const category = yield* seedCategory('Groceries');

            yield* Effect.forEach(
                Array.from({ length: RUNWAY_WINDOW_MONTHS + 2 }, (_, index) => index),
                monthsAgo => seedExpense(accountId, category.id, REGULAR_MONTHLY_AMOUNT, monthsAgo),
                { discard: true }
            );
            yield* testDb.run(sql`ANALYZE`);

            const monthsAgoOffset = `-${RUNWAY_WINDOW_MONTHS} months`;

            const oldPredicateIds = (yield* testDb.all<{ id: number }>(
                sql`SELECT id FROM transactions
                 WHERE strftime('%Y-%m', operated_at, 'unixepoch') >= strftime('%Y-%m', 'now', ${monthsAgoOffset})
                   AND strftime('%Y-%m', operated_at, 'unixepoch') < strftime('%Y-%m', 'now')
                 ORDER BY id`
            )).map(row => row.id);

            const newPredicateIds = (yield* testDb.all<{ id: number }>(
                sql`SELECT id FROM transactions
                 WHERE operated_at >= unixepoch(strftime('%Y-%m-01', 'now', ${monthsAgoOffset}))
                   AND operated_at < unixepoch(strftime('%Y-%m-01', 'now'))
                 ORDER BY id`
            )).map(row => row.id);

            expect(newPredicateIds.length).toBeGreaterThan(0);
            expect(newPredicateIds).toStrictEqual(oldPredicateIds);

            const statisticsRepository = yield* StatisticsRepository;
            const seriesPlan = yield* explainQueryPlan(
                statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, RUNWAY_WINDOW_MONTHS)
            );

            expect(seriesPlan.some(detail => detail.includes('transactions_visible_operated_idx'))).toBe(true);
            expect(seriesPlan.some(detail => detail.includes('SCAN transactions '))).toBe(false);

            const driverPlan = yield* explainQueryPlan(
                statisticsRepository.getRunwayDriverSeriesQuery(
                    DEFAULT_TRANSACTION_FILTER,
                    instrumentId,
                    RunwayDriverDimensionEnum.CATEGORY,
                    RUNWAY_WINDOW_MONTHS,
                    LanguageEnum.EN
                )
            );

            expect(driverPlan.some(detail => detail.includes('transactions_visible_operated_idx'))).toBe(true);
            expect(driverPlan.some(detail => detail.includes('SCAN transactions '))).toBe(false);
        }).pipe(Effect.provide(TestLayer))
    );
});
