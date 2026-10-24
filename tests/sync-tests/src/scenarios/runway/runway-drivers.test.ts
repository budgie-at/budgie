import { aggregateRunwayDrivers } from '@app/runway/utils/aggregate-runway-drivers.util';
import {
    AccountEntityTable,
    AccountTypeEnum,
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
import { eq, sql } from 'drizzle-orm';
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

const aggregate = Effect.fnUntraced(function* (dimension: RunwayDriverDimensionEnum, instrumentId: number, isAllIn: boolean) {
    const statisticsRepository = yield* StatisticsRepository;
    const seriesRows = yield* statisticsRepository.getRunwaySeriesQuery(
        DEFAULT_TRANSACTION_FILTER,
        instrumentId,
        RUNWAY_WINDOW_MONTHS,
        false
    );
    const driverRows = yield* statisticsRepository.getRunwayDriverSeriesQuery(
        DEFAULT_TRANSACTION_FILTER,
        instrumentId,
        dimension,
        RUNWAY_WINDOW_MONTHS,
        LanguageEnum.EN,
        false
    );
    const categoryRows = yield* statisticsRepository.getRunwayDriverSeriesQuery(
        DEFAULT_TRANSACTION_FILTER,
        instrumentId,
        RunwayDriverDimensionEnum.CATEGORY,
        RUNWAY_WINDOW_MONTHS,
        LanguageEnum.EN,
        false
    );

    return {
        drivers: aggregateRunwayDrivers(driverRows, seriesRows, isAllIn).drivers,
        irregularMonthlyAmount: aggregateRunwayDrivers(categoryRows, seriesRows, isAllIn).irregularMonthlyAmount
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

            const { drivers, irregularMonthlyAmount } = yield* aggregate(RunwayDriverDimensionEnum.CATEGORY, instrumentId, true);

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
            expect((yield* aggregate(RunwayDriverDimensionEnum.CATEGORY, instrumentId, false)).drivers).toStrictEqual([
                { id: regular.id, title: regular.title, monthlyAmount: REGULAR_MONTHLY_AMOUNT, isIrregular: false, foldedDriverCount: 0 }
            ]);
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

            const tagBreakdown = yield* aggregate(RunwayDriverDimensionEnum.TAG, instrumentId, true);

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
                statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, RUNWAY_WINDOW_MONTHS, false)
            );

            expect(seriesPlan.some(detail => detail.includes('transactions_visible_operated_idx'))).toBe(true);
            expect(seriesPlan.some(detail => detail.includes('SCAN transactions '))).toBe(false);

            const driverPlan = yield* explainQueryPlan(
                statisticsRepository.getRunwayDriverSeriesQuery(
                    DEFAULT_TRANSACTION_FILTER,
                    instrumentId,
                    RunwayDriverDimensionEnum.CATEGORY,
                    RUNWAY_WINDOW_MONTHS,
                    LanguageEnum.EN,
                    false
                )
            );

            expect(driverPlan.some(detail => detail.includes('transactions_visible_operated_idx'))).toBe(true);
            expect(driverPlan.some(detail => detail.includes('SCAN transactions '))).toBe(false);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('runway account scope', () => {
    const readTotals = Effect.fnUntraced(function* (instrumentId: number, isCryptoIncluded: boolean) {
        const statisticsRepository = yield* StatisticsRepository;
        const seriesRows = yield* statisticsRepository.getRunwaySeriesQuery(
            DEFAULT_TRANSACTION_FILTER,
            instrumentId,
            RUNWAY_WINDOW_MONTHS,
            isCryptoIncluded
        );
        const driverRows = yield* statisticsRepository.getRunwayDriverSeriesQuery(
            DEFAULT_TRANSACTION_FILTER,
            instrumentId,
            RunwayDriverDimensionEnum.CATEGORY,
            RUNWAY_WINDOW_MONTHS,
            LanguageEnum.EN,
            isCryptoIncluded
        );

        return {
            seriesExpense: seriesRows.reduce((total, row) => total + row.expense, 0),
            driverExpense: driverRows.reduce((total, row) => total + row.amount, 0)
        };
    });

    it.effect('counts only active liquid accounts, plus crypto when it is included', () =>
        Effect.gen(function* () {
            const { instrumentId } = yield* seedScenario();
            const category = yield* seedCategory('Groceries');
            const liquid = yield* seed.account({ instrumentId, type: AccountTypeEnum.BANK });
            const crypto = yield* seed.account({ instrumentId, type: AccountTypeEnum.CRYPTO });
            const deleted = yield* seed.account({ instrumentId, type: AccountTypeEnum.BANK });
            const excludedAccounts = [
                deleted,
                yield* seed.account({ instrumentId, type: AccountTypeEnum.BANK, isActive: false }),
                yield* seed.account({ instrumentId, type: AccountTypeEnum.DEPOSIT })
            ];

            yield* testDb.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, deleted.id));
            yield* seedExpense(liquid.id, category.id, 30 * PRECISION, 1);
            yield* seedExpense(crypto.id, category.id, 5 * PRECISION, 1);
            yield* Effect.forEach(excludedAccounts, account => seedExpense(account.id, category.id, 70 * PRECISION, 1), { discard: true });

            expect(yield* readTotals(instrumentId, false)).toStrictEqual({ seriesExpense: 30 * PRECISION, driverExpense: 30 * PRECISION });
            expect(yield* readTotals(instrumentId, true)).toStrictEqual({ seriesExpense: 35 * PRECISION, driverExpense: 35 * PRECISION });
        }).pipe(Effect.provide(TestLayer))
    );
});
